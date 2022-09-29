const {defaults} = require('jest-config');

module.exports = {
    ...defaults,
    transform: {"\\.js$": "babel-jest"},
    transformIgnorePatterns: ["/node_modules/(?!(ol|ol-mapbox-style|jsts|usng|usng-map-collar)/)"],
    moduleDirectories: ["./src", "./node_modules"],
    setupFiles: ["./tests/setup.js"],
    testEnvironment: "jsdom",
};
