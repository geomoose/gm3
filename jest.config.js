const {defaults} = require('jest-config');

module.exports = {
    ...defaults,
    transform: {"\\.js$": "babel-jest"},
    transformIgnorePatterns: ["/node_modules/(?!(ol|ol-mapbox-style|jsts|geotiff|quick-lru|rbush|quickselect|pbf)/)"],
    moduleDirectories: ["./src", "./node_modules"],
    setupFiles: ["./tests/setup.js"],
    testEnvironment: "jsdom",
};
