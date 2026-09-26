import { spawnSync } from "node:child_process";

for (const args of [
  ["node_modules/@graphql-codegen/cli/cjs/bin.js", "--config", "codegen.ts"],
  ["node_modules/next/dist/bin/next", "build", "--webpack"],
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, ANALYZE: "true" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
