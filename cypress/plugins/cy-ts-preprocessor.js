const wp = require("@cypress/webpack-preprocessor");

const webpackOptions = {
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true
            }
          }
        ]
      }
    ]
  }
};

const options = {
  webpackOptions
};

module.exports = wp(options);
