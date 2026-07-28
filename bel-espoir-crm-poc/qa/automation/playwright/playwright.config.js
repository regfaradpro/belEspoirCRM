// @ts-check
const path = require("path");
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false, // les scénarios partagent l'état du CRM (reset entre chaque test)
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "report" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node server.js",
    cwd: path.resolve(__dirname, "../../../app"),
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 30 * 1000,
  },
});
