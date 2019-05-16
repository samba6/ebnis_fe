// babel.config.js
module.exports = api => {
  api.cache(true);
  const isUnitTest = process.env.IS_UNIT_TEST === "true";

  if (isUnitTest) {
    return {
      presets: ["react-app"]
    };
  }

  return {};
};
