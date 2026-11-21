// Explicit offline alternative; normal Playwright runs use the real demo server.
process.env.E2E_MODE = "fixture";
module.exports = require("./playwright.config");
