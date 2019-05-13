module.exports = {
  preset: "ts-jest",
  collectCoverageFrom: [
    "src/**/*.ts*",
    "!src/__tests__/**",
    "!node_modules/**",
    "!src/logger.ts",
    "!src/state/**",
    "!src/pages/**",
    "!src/**/refresh-to-app.ts",
    "!src/graphql/**",
    "!src/components/ToOtherAuthLink/**",
    "!src/components/AuthRequired/**",
    "!src/components/Layout/**",
    "!src/components/Page404/**",
    "!src/components/SidebarHeader/index.tsx",
    "!src/components/Header/fetch-logo.tsx",
    "!src/components/use-is-logged-in.ts",
    "!src/components/RootHelmet/**",
    "!src/components/with-user.tsx",
    "!src/components/**/index.ts",
    "!src/**/*.d.ts",
    "!src/context.ts",
    "!src/socket.ts"
  ],
  setupFiles: ["<rootDir>/loadershim.js", "react-app-polyfill/jsdom"],
  setupFilesAfterEnv: ["<rootDir>/config/jest/setupTests.js"],
  testRegex: "src/__tests__/.+?\\.test\\.tsx?$",
  testEnvironment: "jest-environment-jsdom-fourteen",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
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
    __PATH_PREFIX__: "",
    "ts-jest": {
      isolatedModules: true
    }
  },
  testURL: "http://localhost"
};
