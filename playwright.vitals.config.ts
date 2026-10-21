import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  forbidOnly: !!process.env.CI,
  testDir: "./performance",
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["./scripts/vitals-reporter.mjs"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3200",
    locale: "en-US",
    timezoneId: "UTC",
    serviceWorkers: "block",
  },
  webServer: [
    {
      command: "node scripts/vitals-fixture.mjs",
      url: "http://127.0.0.1:3201/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        "npm run codegen && npx next build --experimental-build-mode compile && npx next build --experimental-build-mode generate && npx next start --port 3200",
      cwd: process.env.VITALS_APP_DIR ?? process.cwd(),
      url: "http://127.0.0.1:3200",
      reuseExistingServer: !process.env.CI,
      timeout: 600_000,
      env: {
        GRAPHQL_URL: "http://127.0.0.1:3201/graphql",
        NEXT_PUBLIC_GRAPHQL_URL: "http://127.0.0.1:3201/graphql",
        // Registry RPC is deliberately unavailable; never measure an external testnet.
        NEXT_PUBLIC_SOROBAN_RPC_URL: "http://127.0.0.1:59999",
      },
    },
  ],
});
