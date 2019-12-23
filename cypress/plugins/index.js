/* eslint-disable @typescript-eslint/no-var-requires */
const { webpackPreprocessorFn } = require("./webpack-preprocessor");

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on("file:preprocessor", webpackPreprocessorFn);
};
