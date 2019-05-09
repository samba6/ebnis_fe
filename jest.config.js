module.exports = {
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/src/__tests__/test_utils",
    "<rootDir>/src/logger.ts",
    "<rootDir>/src/.+?\\.d\\.ts$",
    "<rootDir>/src/.+?\\.scss$",
    "<rootDir>/src/components/.+?/index\\.ts$",
    "<rootDir>/src/state/",
    "<rootDir>/src/pages/",
    "<rootDir>/src/.*?refresh-to-app"
  ],
  setupFiles: ["react-app-polyfill/jsdom"],
  setupFilesAfterEnv: ["<rootDir>/config/jest/setupTests.js"],
  testRegex: "src/__tests__/.+?\\.test\\.tsx?$",
  testEnvironment: "jest-environment-jsdom-fourteen",
  transform: {
    "^.+\\.tsx?$": "<rootDir>/node_modules/babel-jest",
    "^.+\\.jsx?$": "<rootDir>/config/jest/gatsby-preprocess.js",
    "^.+\\.css$": "<rootDir>/config/jest/cssTransform.js",
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)":
      "<rootDir>/config/jest/fileTransform.js"
  },
  transformIgnorePatterns: [
    "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$",
    "^.+\\.module\\.(css|sass|scss)$"
  ],
  moduleNameMapper: {
    "^react-native$": "react-native-web",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy"
  },
  moduleFileExtensions: ["js", "ts", "tsx", "json", "jsx", "node"],
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname"
  ],
  watchPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/cypress/",
    "<rootDir>/package.json",
    "<rootDir>/gatsby-*",
    "<rootDir>/src/pages/",
    "<rootDir>/\\.cache/",
    "<rootDir>/public/"
  ],
  globals: {
    __PATH_PREFIX__: ""
  }
};
