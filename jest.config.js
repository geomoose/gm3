const {defaults} = require('jest-config');

module.exports = {
    ...defaults,
    transform: {"\\.js$": "babel-jest"},
    transformIgnorePatterns: ["/node_modules/(?!(ol|ol-mapbox-style|jsts|geotiff|quick-lru|rbush|quickselect|pbf|usng-map-collar|hyparquet|hyparquet-compressors|hysnappy|fzstd)/)"],
    moduleDirectories: ["./src", "./node_modules"],
    setupFiles: ["./tests/setup.js"],
    testEnvironment: "jsdom",
    moduleNameMapper: {
      "^hyparquet$": "<rootDir>/node_modules/hyparquet/src/index.js",
      "^hyparquet-compressors$": "<rootDir>/node_modules/hyparquet-compressors/src/index.js",
      "^@gm3/(.*)$": "<rootDir>/src/gm3/$1",
    },
};
