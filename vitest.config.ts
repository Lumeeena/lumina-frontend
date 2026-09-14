import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` path alias in tsconfig.json.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // Node by default — most of what is worth testing here is plain TypeScript.
    // Component tests opt into a DOM per file with `@vitest-environment jsdom`,
    // which keeps the majority of the suite off a jsdom startup cost.
    environment: "node",
    // Playwright specs live in e2e/ and are run by `npm run test:e2e`; without
    // this vitest tries to collect them and fails on the Playwright imports.
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    coverage: {
      provider: "v8",
      // `text` for the CI log, `html` + `lcov` as uploadable artifacts.
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/**/*.tsx"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "lib/__fixtures__/**", "app/layout.tsx"],
      // Deliberately not a hard gate yet: the point of reporting it is to stop
      // coverage silently rotting back toward zero, and a gate set today would
      // be chosen to pass today rather than to mean anything.
    },
  },
});
