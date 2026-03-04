import { defineConfig, devices } from "@playwright/test"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./__tests__/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    extraHTTPHeaders: {
      "x-playwright-test": "1",
    },
  },

  projects: [
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    env: {
      ...process.env,
      PLAYWRIGHT_TEST: "true",
    },
    reuseExistingServer: false,
    timeout: 120000,
  },
})
