const webpackPreprocessor = require("@cypress/webpack-preprocessor");

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
            loader: require.resolve("babel-loader"),
            options: {
              presets: [require.resolve("@babel/preset-typescript")]
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

exports.webpackPreprocessorFn = webpackPreprocessor(options);
