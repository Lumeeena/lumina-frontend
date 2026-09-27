import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config.
 *
 * The app is started by Playwright itself against a production build, because
 * that is what CI and users actually run — a dev-server-only E2E suite passes
 * happily while the built app is broken.
 *
 * The default suite deliberately points at a dead port so it exercises the
 * unreachable-backend fallbacks. The live-backend CI job overrides
 * `E2E_GRAPHQL_URL` and runs the focused seeded-data spec separately.
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
      GRAPHQL_URL: process.env.E2E_GRAPHQL_URL ?? "http://127.0.0.1:59999/graphql",
      NEXT_PUBLIC_GRAPHQL_URL: process.env.E2E_GRAPHQL_URL ?? "http://127.0.0.1:59999/graphql",
    },
  },
});
