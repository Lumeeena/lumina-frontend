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
    setupFiles: ["./vitest.setup.ts"],
    // Playwright specs live in e2e/ and are run by `npm run test:e2e`; without
    // this vitest tries to collect them and fails on the Playwright imports.
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    coverage: {
      provider: "v8",
      // `text` for the CI log, `html` + `lcov` as uploadable artifacts.
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/**/*.tsx"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "lib/__fixtures__/**",
        "lib/generated/**",
        "app/layout.tsx",
      ],
      // Gate at the current level to prevent erosion without setting an aspirational target.
      // Raise by fixing the reported uncovered lines, not by lowering the threshold.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
