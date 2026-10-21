import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { measureRoutes } from "./bundle-report.mjs";

// Source paths survive minification and tree shaking; searching emitted JS for
// package names would miss exactly the production regressions this guards.
export function sourcePackages(map) {
  const packages = (map.sources ?? []).flatMap((source) => {
    const matches = [
      ...source
        .replaceAll("\\", "/")
        .matchAll(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/g),
    ];
    return matches.length ? matches.map((match) => match[1]) : [];
  });
  return [
    ...new Set([
      ...packages,
      ...(map.sections ?? []).flatMap(({ map: section }) =>
        sourcePackages(section),
      ),
    ]),
  ].sort();
}

export function checkRules(packagesByRoute, rules) {
  return Object.entries(packagesByRoute).flatMap(([route, packages]) =>
    rules
      .filter(
        (rule) =>
          packages.includes(rule.package) &&
          !rule.allowedRoutes.includes(route),
      )
      .map((rule) => ({ route, ...rule })),
  );
}

export function inspectContents(dist, rules) {
  const { chunksByRoute } = measureRoutes(dist);
  const packagesByChunk = {};
  const packagesByRoute = {};
  for (const [route, chunks] of Object.entries(chunksByRoute)) {
    packagesByRoute[route] = [
      ...new Set(
        chunks.flatMap((chunk) => {
          if (!chunk.endsWith(".js")) return [];
          if (!packagesByChunk[chunk]) {
            const chunkFile = path.join(dist, chunk);
            // Turbopack hashes map filenames independently of their JS chunks.
            const references = [
              ...readFileSync(chunkFile, "utf8").matchAll(
                /^\/\/[#@]\s*sourceMappingURL=(\S+)\s*$/gm,
              ),
            ];
            const mapFile = references.length
              ? path.resolve(path.dirname(chunkFile), references.at(-1)[1])
              : `${chunkFile}.map`;
            let map;
            try {
              map = JSON.parse(readFileSync(mapFile, "utf8"));
              if (!Array.isArray(map.sources) && !Array.isArray(map.sections)) {
                throw new Error("Source map has no sources or sections");
              }
            } catch (cause) {
              throw new Error(
                `Missing or invalid source map ${mapFile}; run npm run build:bundle`,
                { cause },
              );
            }
            packagesByChunk[chunk] = sourcePackages(map);
          }
          return packagesByChunk[chunk];
        }),
      ),
    ].sort();
    if (!packagesByRoute[route].length) {
      throw new Error(
        `No package sources found for ${route}; refusing an empty inventory`,
      );
    }
  }
  return {
    packagesByRoute,
    packagesByChunk,
    violations: checkRules(packagesByRoute, rules),
  };
}

export function main(dist = ".next", rulesFile = "bundle-rules.json") {
  const { rules } = JSON.parse(readFileSync(rulesFile, "utf8"));
  if (!Array.isArray(rules) || !rules.length)
    throw new Error("No bundle rules configured");
  const report = inspectContents(dist, rules);
  writeFileSync(
    path.join(dist, "bundle-contents.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  for (const { route, package: dependency, reason } of report.violations) {
    console.error(
      `${route}: forbidden initial dependency ${dependency}. ${reason}`,
    );
  }
  if (report.violations.length) return 1;
  console.log(
    `Bundle contents passed for ${Object.keys(report.packagesByRoute).length} routes (${rules.length} rules).`,
  );
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    process.exitCode = main(...process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
