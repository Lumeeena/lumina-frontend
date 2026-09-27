import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import zlib from "node:zlib";

/**
 * Per-route budget for the JavaScript a browser downloads before a route can
 * paint, measured from the production build in `.next`.
 *
 * A route's first load is every chunk its client-reference manifest lists as
 * synchronous, plus the shared root chunks Next loads on every page. The
 * measurement is gzip, because that is what a slow connection actually pays.
 *
 * Run `npm run bundle:update` to accept the sizes a change produced, and
 * commit the budget diff: raising a budget should be as visible as any other
 * line in the pull request.
 */

/** Accepted size plus this much room before a route counts as over budget. */
export const HEADROOM_BYTES = 5 * 1024;

const DEFAULT_DIST = ".next";
const DEFAULT_BUDGET_FILE = "bundle-budget.json";
const REPORT_FILE = "bundle-report.json";
const GITHUB_ANNOTATION_LIMIT = 5;

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** `/explorer/page` (an app-paths-manifest key) is `/explorer`; `/page` is `/`. */
export function routePath(key) {
  const route = key.replace(/\/page$/, "");
  return route === "" ? "/" : route;
}

/** Chunk URLs are `/_next/static/...`; on disk they sit at `static/...`. */
function relativeChunk(chunk) {
  return chunk.startsWith("/_next/") ? chunk.slice("/_next/".length) : chunk;
}

function chunkPath(distDir, chunk) {
  return path.join(distDir, relativeChunk(chunk));
}

/**
 * The client-reference manifest ships as an assignment to `globalThis`, so it
 * is evaluated in a throwaway context rather than parsed as JSON.
 */
function clientManifest(file, key) {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(file, "utf8"), context);
  const manifest = context.__RSC_MANIFEST?.[key];
  if (!manifest) {
    throw new Error(`No client-reference manifest entry for ${key} in ${file}`);
  }
  return manifest;
}

/**
 * The runtime and framework entry every route loads. Polyfills are left out on
 * purpose: Next serves them with `noModule`, so no current browser downloads
 * them and they would inflate every route with bytes nobody pays for.
 */
function sharedChunks(distDir) {
  const buildManifest = readJson(path.join(distDir, "build-manifest.json"));
  if (!Array.isArray(buildManifest.rootMainFiles)) {
    throw new Error(`No rootMainFiles in ${distDir}/build-manifest.json`);
  }
  return buildManifest.rootMainFiles;
}

/**
 * First-load JavaScript per route, in gzipped bytes, alongside the chunks it
 * was counted from so a diff of the report says what moved.
 */
export function measureRoutes(distDir) {
  const appPaths = readJson(
    path.join(distDir, "server", "app-paths-manifest.json"),
  );
  const shared = sharedChunks(distDir);
  const gzipCache = new Map();
  const gzipSize = (chunk) => {
    if (!gzipCache.has(chunk)) {
      const file = chunkPath(distDir, chunk);
      if (!existsSync(file)) {
        throw new Error(`Build is missing ${file}; rebuild before measuring`);
      }
      gzipCache.set(chunk, zlib.gzipSync(readFileSync(file)).length);
    }
    return gzipCache.get(chunk);
  };

  const routes = {};
  const chunksByRoute = {};
  for (const key of Object.keys(appPaths).sort()) {
    // Route handlers (`.../route`) have no browser bundle of their own.
    if (!key.endsWith("/page")) continue;
    const route = routePath(key);
    const manifestFile = path.join(
      distDir,
      "server",
      "app",
      key.slice(1).replace(/page$/, "page_client-reference-manifest.js"),
    );
    if (!existsSync(manifestFile)) {
      throw new Error(
        `No client-reference manifest for ${route}: ${manifestFile}`,
      );
    }
    const chunks = new Set(shared.map(relativeChunk));
    for (const value of Object.values(
      clientManifest(manifestFile, key).clientModules,
    )) {
      if (value.async) continue;
      for (const chunk of value.chunks) chunks.add(relativeChunk(chunk));
    }
    const sorted = [...chunks].sort();
    routes[route] = sorted.reduce((total, chunk) => total + gzipSize(chunk), 0);
    chunksByRoute[route] = sorted;
  }
  return {
    routes,
    chunksByRoute,
    shared: shared.map(relativeChunk).sort(),
    chunkBytes: Object.fromEntries(gzipCache),
  };
}

/**
 * Compare measured sizes against the accepted ones. `budget.routes` holds the
 * last accepted size per route; the ceiling above it is that size plus
 * `headroomBytes`, which keeps byte-level churn from failing the build while
 * still catching a dependency-sized jump.
 */
export function compareRoutes(measured, budget) {
  const headroom = Number.isFinite(budget.headroom)
    ? budget.headroom
    : HEADROOM_BYTES;
  const accepted = budget.routes ?? {};
  const rows = Object.entries(measured)
    .map(([route, actual]) => {
      const baseline = accepted[route];
      if (baseline === undefined) {
        return {
          route,
          actual,
          baseline: null,
          budget: null,
          delta: null,
          status: "unbudgeted",
        };
      }
      const ceiling = baseline + headroom;
      return {
        route,
        actual,
        baseline,
        budget: ceiling,
        delta: actual - baseline,
        status: actual > ceiling ? "over" : "ok",
      };
    })
    .sort((left, right) => right.actual - left.actual);
  const stale = Object.keys(accepted)
    .filter((route) => !(route in measured))
    .sort();
  return { rows, stale, headroom };
}

export function formatKb(bytes) {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

export function formatDelta(delta) {
  if (delta === null) return "new";
  return delta > 0 ? `+${formatKb(delta)}` : formatKb(delta);
}

function renderTable(header, body, rightAligned) {
  const widths = header.map((title, column) =>
    Math.max(title.length, ...body.map((row) => row[column].length)),
  );
  const line = (row) =>
    row
      .map((cell, column) =>
        rightAligned.includes(column)
          ? String(cell).padStart(widths[column])
          : String(cell).padEnd(widths[column]),
      )
      .join("  ")
      .trimEnd();
  return [
    line(header),
    line(widths.map((width) => "-".repeat(width))),
    ...body.map(line),
  ].join("\n");
}

export function formatTable(rows) {
  return renderTable(
    ["route", "size", "delta", "budget", "status"],
    rows.map((row) => [
      row.route,
      formatKb(row.actual),
      formatDelta(row.delta),
      row.budget === null ? "-" : formatKb(row.budget),
      row.status,
    ]),
    [1, 2, 3],
  );
}

/** What `--update` changed, so the reviewer sees a raise as a number. */
export function formatUpdateTable(measured, previous) {
  const accepted = previous.routes ?? {};
  return renderTable(
    ["route", "before", "after", "change"],
    Object.keys(measured)
      .sort()
      .map((route) => {
        const before = accepted[route];
        const after = measured[route];
        return [
          route,
          before === undefined ? "-" : formatKb(before),
          formatKb(after),
          before === undefined ? "new" : formatDelta(after - before),
        ];
      }),
    [1, 2, 3],
  );
}

export function formatMarkdown(rows, stale, headroom) {
  const lines = [
    "### Bundle budget — first-load JavaScript (gzip)",
    "",
    "| route | size | delta | budget | status |",
    "| --- | ---: | ---: | ---: | --- |",
    ...rows.map(
      (row) =>
        `| \`${row.route}\` | ${formatKb(row.actual)} | ${formatDelta(row.delta)} | ${
          row.budget === null ? "-" : formatKb(row.budget)
        } | ${row.status} |`,
    ),
    "",
    `Accepted size plus ${formatKb(headroom)} of headroom, from \`bundle-budget.json\`.`,
  ];
  if (stale.length > 0) {
    lines.push(
      "",
      `Budget entries with no matching route: ${stale.map((route) => `\`${route}\``).join(", ")}.`,
    );
  }
  return lines.join("\n");
}

function annotation(level, message) {
  if (process.env.GITHUB_ACTIONS !== "true") return;
  // Annotations surface on the pull request itself, above the job log.
  console.log(
    `::${level} title=Bundle budget::${message.replace(/\r?\n/g, "%0A")}`,
  );
}

function writeReport(distDir, result, measured) {
  const report = {
    headroomBytes: result.headroom,
    // What every route pays for the framework, before its own code.
    sharedBytes: measured.shared.reduce(
      (total, chunk) => total + measured.chunkBytes[chunk],
      0,
    ),
    routes: Object.fromEntries(
      result.rows.map((row) => [
        row.route,
        {
          bytes: row.actual,
          baseline: row.baseline,
          budget: row.budget,
          delta: row.delta,
          status: row.status,
          chunks: measured.chunksByRoute[row.route] ?? [],
        },
      ]),
    ),
    stale: result.stale,
  };
  const file = path.join(distDir, REPORT_FILE);
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return file;
}

function measureBuild(distDir) {
  const manifest = path.join(distDir, "build-manifest.json");
  if (!existsSync(manifest)) {
    throw new Error(
      `No build found in ${distDir}. Run \`npm run build:bundle\` first.`,
    );
  }
  return measureRoutes(distDir);
}

function readBudget(file) {
  if (!existsSync(file)) return { routes: {}, headroom: HEADROOM_BYTES };
  const budget = readJson(file);
  return {
    routes: budget.routes ?? {},
    headroom: budget.headroomBytes ?? HEADROOM_BYTES,
  };
}

function writeBudget(file, measured, headroom) {
  const routes = Object.fromEntries(
    Object.keys(measured)
      .sort()
      .map((route) => [route, measured[route]]),
  );
  writeFileSync(
    file,
    `${JSON.stringify({ headroomBytes: headroom, routes }, null, 2)}\n`,
  );
  return { routes, headroom };
}

function main(argv) {
  const options = {
    update: false,
    dist: DEFAULT_DIST,
    budget: DEFAULT_BUDGET_FILE,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--update") {
      options.update = true;
    } else if (argument === "--dist" || argument === "--budget") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} needs a value`);
      index += 1;
      if (argument === "--dist") options.dist = value;
      else options.budget = value;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  const measured = measureBuild(options.dist);
  const previous = readBudget(options.budget);

  if (options.update) {
    const accepted = writeBudget(
      options.budget,
      measured.routes,
      previous.headroom,
    );
    const result = compareRoutes(measured.routes, accepted);
    writeReport(options.dist, result, measured);
    console.log(
      `Accepted ${Object.keys(measured.routes).length} routes into ${options.budget}.\n\n` +
        `${formatUpdateTable(measured.routes, previous)}\n`,
    );
    annotation(
      "notice",
      `Bundle budget updated in ${options.budget}; the diff of that file is the raise.`,
    );
    return 0;
  }

  if (!existsSync(options.budget)) {
    throw new Error(
      `No ${options.budget} to compare against. Run \`npm run bundle:update\` and commit it.`,
    );
  }

  const result = compareRoutes(measured.routes, previous);
  const failures = result.rows.filter((row) => row.status !== "ok");
  console.log(
    `First-load JavaScript per route (gzip)\n\n${formatTable(result.rows)}\n`,
  );
  if (result.stale.length > 0) {
    console.log(
      `Budget entries with no matching route: ${result.stale.join(", ")}\n`,
    );
    annotation(
      "warning",
      `Stale bundle budget entries: ${result.stale.join(", ")}. Run \`npm run bundle:update\` to drop them.`,
    );
  }

  const reportFile = writeReport(options.dist, result, measured);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    appendFileSync(
      summary,
      `${formatMarkdown(result.rows, result.stale, result.headroom)}\n`,
    );
  }

  for (const row of failures.slice(0, GITHUB_ANNOTATION_LIMIT)) {
    if (row.status === "over") {
      annotation(
        "error",
        `\`${row.route}\` is ${formatKb(row.actual - row.budget)} over budget ` +
          `(${formatKb(row.actual)} measured, ${formatKb(row.budget)} allowed). ` +
          `Shrink it, or accept the size with \`npm run bundle:update\`.`,
      );
    } else {
      annotation(
        "error",
        `\`${row.route}\` has no bundle budget (${formatKb(row.actual)} measured). ` +
          `Run \`npm run bundle:update\` and commit ${options.budget}.`,
      );
    }
  }

  if (failures.length === 0) {
    console.log(
      `All ${result.rows.length} routes are within budget. Report: ${reportFile}`,
    );
    return 0;
  }
  console.error(
    `\n${failures.length} of ${result.rows.length} routes failed the budget check:\n` +
      failures
        .map((row) =>
          row.status === "over"
            ? `  ${row.route} is ${formatKb(row.actual - row.budget)} over (${formatKb(row.actual)}, budget ${formatKb(row.budget)})`
            : `  ${row.route} has no budget entry (${formatKb(row.actual)})`,
        )
        .join("\n") +
      `\n\nAccept the sizes with \`npm run bundle:update\` and commit ${options.budget}.\nReport: ${reportFile}`,
  );
  return 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  }
}
