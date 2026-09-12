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
  },
});
