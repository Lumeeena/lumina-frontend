import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.ERROR_REPORTING_URL;
if (!endpoint) process.exit(0);

const root = path.resolve(".next/static");
async function maps(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory()
          ? maps(target)
          : target.endsWith(".map")
            ? [target]
            : [];
      }),
    )
  ).flat();
}

for (const filename of await maps(root)) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.ERROR_REPORTING_TOKEN
        ? { Authorization: `Bearer ${process.env.ERROR_REPORTING_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      release: process.env.npm_package_version ?? "unknown",
      filename: path.relative(".next", filename),
      sourceMap: JSON.parse(await readFile(filename, "utf8")),
    }),
  });
  if (!response.ok)
    throw new Error(`Source-map upload failed (${response.status})`);
}
