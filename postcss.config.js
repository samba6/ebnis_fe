/* eslint-disable @typescript-eslint/no-var-requires*/
module.exports = {
  plugins: [
    require("postcss-import"),
    require("postcss-extend-rule"),
    require("postcss-advanced-variables"),
    require("postcss-property-lookup"),
    require("postcss-preset-env")({ stage: 1 }),
    require("tailwindcss"),
    require("postcss-custom-properties"),
    require("postcss-nested"),
  ],
};
