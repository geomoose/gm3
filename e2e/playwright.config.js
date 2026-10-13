const path = require("path");
const { defineConfig, devices } = require("@playwright/test");
const { mode } = require("./settings");

const live = mode === "live";
// Live runs check the demo server first and stop early if it is down.
const dependencies = live ? ["demo-setup"] : [];

module.exports = defineConfig({
  testDir: "./tests",
  timeout: live ? 90_000 : 45_000,
  expect: { timeout: live ? 30_000 : 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Limit load on the shared demo server.
  workers: live || process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: path.join(__dirname, "report") }]],
  outputDir: "./test-results",
  use: {
    baseURL: "http://127.0.0.1:4000",
    locale: "en-US",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    ...(live ? [{ name: "demo-setup", testMatch: /demo-setup\.js$/ }] : []),
    {
      name: "desktop-chromium",
      testMatch: /desktop(-[a-z]+)?\.spec\.js$/,
      dependencies,
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile\.spec\.js$/,
      dependencies,
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm start",
    cwd: path.resolve(__dirname, ".."),
    url: "http://127.0.0.1:4000/examples/desktop/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
