import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config.
 *
 * The app is started by Playwright itself against a production build, because
 * that is what CI and users actually run — a dev-server-only E2E suite passes
 * happily while the built app is broken.
 *
 * `NEXT_PUBLIC_GRAPHQL_URL` deliberately points at a port nothing is listening
 * on. These tests assert the app's navigation and its unreachable-backend
 * fallbacks, which is the behaviour that has to hold without a live indexer;
 * data-shape assertions belong in the component and page tests, where the
 * response can be pinned exactly.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx next start --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      GRAPHQL_URL: "http://127.0.0.1:59999/graphql",
      NEXT_PUBLIC_GRAPHQL_URL: "http://127.0.0.1:59999/graphql",
    },
  },
});
