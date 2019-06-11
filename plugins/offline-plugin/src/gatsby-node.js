const fs = require(`fs`);
const workboxBuild = require(`workbox-build`);
const path = require(`path`);
const slash = require(`slash`);
const lodashUnique = require("lodash/uniq");
const lodashFlatten = require("lodash/flatten");

exports.createPages = ({ actions }) => {
  if (process.env.NODE_ENV === `production`) {
    const { createPage } = actions;
    createPage({
      path: `/offline-plugin-app-shell-fallback/`,
      component: slash(path.resolve(`${__dirname}/app-shell.js`))
    });
  }
};

exports.onPostBuild = (args, { otherOptions = {}, ...pluginOptions }) => {
  const { pathPrefix } = args;
  const rootDir = `public`;

  // Remove the custom prefix (if any) so Workbox can find the files.
  // This is added back at runtime (see modifyURLPrefix) in order to serve
  // from the correct location.
  const omitPrefix = path => path.slice(pathPrefix.length);

  let globPatterns = getAllChunks(otherOptions);

  globPatterns = lodashUnique(globPatterns.map(omitPrefix));

  const manifests = [`manifest.json`, `manifest.webmanifest`];
  manifests.forEach(file => {
    if (fs.existsSync(`${rootDir}/${file}`)) globPatterns.push(file);
  });

  const workboxBuildOptions = {
    importWorkboxFrom: `local`,
    globDirectory: rootDir,
    globPatterns,
    modifyURLPrefix: {
      // If `pathPrefix` is configured by user, we should replace
      // the default prefix with `pathPrefix`.
      "/": `${pathPrefix}/`
    },
    cacheId: `gatsby-plugin-offline`,
    // Don't cache-bust JS or CSS files, and anything in the static directory,
    // since these files have unique URLs and their contents will never change
    dontCacheBustURLsMatching: /(\.js$|\.css$|static\/)/,
    runtimeCaching: [
      {
        // Use cacheFirst since these don't need to be revalidated (same RegExp
        // and same reason as above)
        urlPattern: /(\.js$|\.css$|static\/)/,
        handler: `CacheFirst`
      },
      {
        // Add runtime caching of various other page resources
        urlPattern: /^https?:.*\.(png|jpg|jpeg|webp|svg|gif|tiff|js|woff|woff2|json|css)$/,
        handler: `StaleWhileRevalidate`
      },
      {
        // Google Fonts CSS (doesn't end in .css so we need to specify it)
        urlPattern: /^https?:\/\/fonts\.googleapis\.com\/css/,
        handler: "StaleWhileRevalidate"
      }
    ],
    skipWaiting: true,
    clientsClaim: true,
    navigateFallback: "/index.html"
    // navigateFallbackWhitelist: [/^\/app/]
  };

  // pluginOptions.plugins is assigned automatically when the user hasn't
  // specified custom options - Workbox throws an error with unsupported
  // parameters, so delete it.
  delete pluginOptions.plugins;
  const combinedOptions = { ...workboxBuildOptions, ...pluginOptions };

  const idbKeyvalFile = `idb-keyval-iife.min.js`;
  const idbKeyvalSource = require.resolve(`idb-keyval/dist/${idbKeyvalFile}`);
  const idbKeyvalDest = `public/${idbKeyvalFile}`;
  fs.createReadStream(idbKeyvalSource).pipe(
    fs.createWriteStream(idbKeyvalDest)
  );

  const swDest = `public/sw.js`;
  return workboxBuild
    .generateSW({ swDest, ...combinedOptions })
    .then(({ count, size, warnings }) => {
      if (warnings) warnings.forEach(warning => console.warn(warning));

      const swAppend = fs
        .readFileSync(`${__dirname}/sw-append.js`, `utf8`)
        .replace(/%pathPrefix%/g, pathPrefix);

      fs.appendFileSync(`public/sw.js`, `\n` + swAppend);

      console.log(
        `\n\nGenerated ${swDest}, which will precache ${count} files, totaling ${size} bytes.\n`
      );
    });
};

function getAllChunks(otherOptions) {
  const rootPath = path.resolve(process.cwd(), "public");

  const webpackStats = JSON.parse(
    fs.readFileSync(path.resolve(rootPath, "webpack.stats.json"), "utf-8")
  );

  let chunks = lodashFlatten(Object.values(webpackStats.assetsByChunkName));

  ["manifest.json", "manifest.webmanifest"].forEach(file => {
    if (fs.existsSync(path.join(rootPath, file))) {
      chunks.push(file);
    }
  });

  function getChunksFromDir(ancestorDirName) {
    let ancestorDirPath = path.resolve(rootPath, ancestorDirName);
    let ancestorDirContents = fs.readdirSync(ancestorDirPath);
    let index = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const staticFileOrDirName = ancestorDirContents[index];

      if (staticFileOrDirName === undefined) {
        break;
      }

      const staticFilePath = path.join(ancestorDirPath, staticFileOrDirName);

      if (fs.lstatSync(staticFilePath).isDirectory()) {
        ancestorDirContents = ancestorDirContents.concat(
          fs.readdirSync(staticFilePath).map(s => `${staticFileOrDirName}/${s}`)
        );
      } else {
        chunks.push(`${ancestorDirName}/${staticFileOrDirName}`);
      }

      ++index;
    }
  }

  const pagesPath = path.resolve(process.cwd(), "src/pages");

  fs.readdirSync(pagesPath).forEach(pageFile => {
    if (fs.lstatSync(path.join(pagesPath, pageFile)).isDirectory()) {
      getChunksFromDir(pageFile);
    } else {
      chunks.push(pageFile.replace(/\.(j|t)sx?$/, ".html"));
    }
  });

  getChunksFromDir("static");

  (otherOptions.directoriesToCache || []).forEach(getChunksFromDir);

  if (otherOptions.globPatternsFn) {
    chunks = chunks.concat(otherOptions.globPatternsFn());
  }

  return chunks;
}
