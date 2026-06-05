const {defaults} = require('jest-config');

module.exports = {
    ...defaults,
    transform: {"\\.js$": "babel-jest"},
    transformIgnorePatterns: ["/node_modules/(?!(ol|ol-mapbox-style|jsts|geotiff|quick-lru|rbush|quickselect|pbf|usng-map-collar)/)"],
    moduleDirectories: ["./src", "./node_modules"],
    setupFiles: ["./tests/setup.js"],
    testEnvironment: "jsdom",
    moduleNameMapper: {
      "^@gm3/(.*)$": "<rootDir>/src/gm3/$1",
    },
};
