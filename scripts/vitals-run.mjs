import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { rmSync } from "node:fs";

const require = createRequire(import.meta.url);
const referenceIndex = process.argv.indexOf("--reference");
if (referenceIndex >= 0 && !process.argv[referenceIndex + 1])
  throw new Error("Expected base checkout directory after --reference");
if (referenceIndex >= 0) {
  rmSync("vitals-reference.json", { force: true });
  rmSync("vitals-reference-error.txt", { force: true });
}
const result = spawnSync(
  process.execPath,
  [
    require.resolve("@playwright/test/cli"),
    "test",
    "--config=playwright.vitals.config.ts",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      UPDATE_VITALS: process.argv.includes("--update") ? "1" : "0",
      VITALS_REFERENCE_RUN: referenceIndex >= 0 ? "1" : "0",
      VITALS_APP_DIR:
        referenceIndex >= 0
          ? path.resolve(process.argv[referenceIndex + 1])
          : process.cwd(),
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
