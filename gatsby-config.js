const path = require("path");
const fs = require("fs");

module.exports = {
  siteMetadata: {
    title: "Ebnis"
  },

  plugins: [
    "gatsby-plugin-typescript",

    {
      resolve: "gatsby-plugin-alias-imports",
      options: {
        alias: {
          "../../theme.config": path.resolve(
            "src/styles/semantic-theme/theme.config"
          )
        },
        extensions: []
      }
    },

    {
      resolve: "gatsby-source-filesystem",

      options: {
        name: "images",

        path: path.join(__dirname, "src", "images")
      }
    },

    "gatsby-plugin-sharp",

    "gatsby-transformer-sharp",

    {
      resolve: "gatsby-plugin-env-variables",

      options: {
        whitelist: ["API_URL"]
      }
    },

    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "Ebnis - Life",
        short_name: "Ebnis",
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#5faac7",
        // Enables "Add to Home screen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: "standalone",
        icon: "src/images/logo.png" // This path is relative to the root of the site.
      }
    },

    {
      resolve: `gatsby-plugin-create-client-paths`,
      options: { prefixes: [`/app/*`] }
    },

    {
      resolve: "offline-plugin",
      options: {
        cacheId: `ebnis-offline`,
        ignoreURLParametersMatching: [/v/],
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        otherOptions: {
          globPatternsFn,
          directoriesToCache: ["icons"]
        }
      }
    },

    "gatsby-plugin-sass",

    "gatsby-plugin-less",

    "gatsby-plugin-netlify"
  ]
};

function globPatternsFn() {
  const rootPath = path.resolve(".", "public");

  const chunks = [];

  fs.readdirSync(rootPath).forEach(filePath => {
    if (/^\d+-.+?\.js$/.test(filePath)) {
      chunks.push(filePath);
    }
  });

  return chunks;
}
