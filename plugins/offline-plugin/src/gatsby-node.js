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
      component: slash(path.resolve(`${__dirname}/app-shell.js`)),
    });
  }
};

exports.onPostBuild = (args, { otherOptions = {}, workboxConfig = {} }) => {
  const { pathPrefix, reporter } = args;
  const rootDir = `public`;

  // Remove the custom prefix (if any) so Workbox can find the files.
  // This is added back at runtime (see modifyURLPrefix) in order to serve
  // from the correct location.
  const omitPrefix = path => path.slice(pathPrefix.length);

  let { chunks: globPatterns, appFile } = getAllChunks(otherOptions);

  globPatterns = lodashUnique(globPatterns.map(omitPrefix));

  const workboxBuildOptions = {
    importWorkboxFrom: `local`,
    globDirectory: rootDir,
    globPatterns,
    modifyURLPrefix: {
      // If `pathPrefix` is configured by user, we should replace
      // the default prefix with `pathPrefix`.
      "/": `${pathPrefix}/`,
    },
    cacheId: `ebnis-app`,
    // Don't cache-bust JS or CSS files, and anything in the static directory,
    // since these files have unique URLs and their contents will never change
    dontCacheBustURLsMatching: /(\.js$|\.css$|static\/)/,
    runtimeCaching: [
      {
        // Use cacheFirst since these don't need to be revalidated (same RegExp
        // and same reason as above)
        urlPattern: /(\.js$|\.css$|static\/)/,
        handler: `CacheFirst`,
      },
      {
        // Add runtime caching of various other page resources
        urlPattern: /^https?:.*\.(png|jpg|jpeg|webp|svg|gif|tiff|js|woff|woff2|css)$/,
        handler: `StaleWhileRevalidate`,
      },
      {
        // Google Fonts CSS (doesn't end in .css so we need to specify it)
        urlPattern: /^https?:\/\/fonts\.googleapis\.com\/css/,
        handler: "StaleWhileRevalidate",
      },
      {
        /**
         * cache all .json resources except /page-data/.*?\.json
         */
        urlPattern: new RegExp("^(?:https?://[^/]+)?/(?!page-data).+?\\.json$"),
        handler: `StaleWhileRevalidate`,
      },
    ],
    skipWaiting: true,
    clientsClaim: true,
  };

  const idbKeyvalFile = `idb-keyval-iife.min.js`;
  const idbKeyvalSource = require.resolve(`idb-keyval/dist/${idbKeyvalFile}`);
  const idbKeyvalDest = `public/${idbKeyvalFile}`;

  fs.createReadStream(idbKeyvalSource).pipe(
    fs.createWriteStream(idbKeyvalDest),
  );

  const swDest = `public/sw.js`;
  return workboxBuild
    .generateSW({ swDest, ...workboxBuildOptions, ...workboxConfig })
    .then(({ count, size, warnings }) => {
      if (warnings) warnings.forEach(warning => console.warn(warning));

      const swAppend = fs
        .readFileSync(`${__dirname}/sw-append.js`, `utf8`)
        .replace(/%pathPrefix%/g, pathPrefix)
        .replace(/%appFile%/g, appFile);

      fs.appendFileSync(`public/sw.js`, `\n` + swAppend);

      reporter.info(
        `\n\nGenerated ${swDest}, which will precache ${count} files, totaling ${size} bytes.\n`,
      );
    });
};

function getAllChunks(options) {
  const rootPath = path.resolve(process.cwd(), "public");

  const webpackStats = JSON.parse(
    fs.readFileSync(path.resolve(rootPath, "webpack.stats.json"), "utf-8"),
  );

  let chunks = lodashFlatten(Object.values(webpackStats.assetsByChunkName));

  const appFile = chunks.find(f => f.startsWith("app-"));

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
        ancestorDirContents.push(
          ...fs
            .readdirSync(staticFilePath)
            .map(s => `${staticFileOrDirName}/${s}`),
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
  getChunksFromDir("page-data");
  getChunksFromDir("offline-plugin-app-shell-fallback");

  (options.directoriesToCache || []).forEach(getChunksFromDir);

  if (options.globPatternsFn) {
    chunks.push(...options.globPatternsFn());
  }

  return { chunks, appFile };
}
