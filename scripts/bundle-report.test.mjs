import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { afterAll, describe, expect, it } from "vitest";
import {
  compareRoutes,
  formatDelta,
  formatKb,
  measureRoutes,
  routePath,
} from "./bundle-report.mjs";

const script = fileURLToPath(new URL("./bundle-report.mjs", import.meta.url));
const dist = mkdtempSync(path.join(os.tmpdir(), "lumina-bundle-"));

function write(file, contents) {
  const target = path.join(dist, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    target,
    typeof contents === "string" ? contents : `${JSON.stringify(contents)}\n`,
  );
}

function clientManifest(key, modules) {
  return (
    "globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};\n" +
    `globalThis.__RSC_MANIFEST[${JSON.stringify(key)}] = ${JSON.stringify({
      clientModules: modules,
    })};\n`
  );
}

function gzipSize(file) {
  return zlib.gzipSync(readFileSync(path.join(dist, file))).length;
}

write("build-manifest.json", {
  rootMainFiles: ["static/chunks/main.js"],
  // Served with noModule, so it must never reach a route's total.
  polyfillFiles: ["static/chunks/polyfill.js"],
});
write("server/app-paths-manifest.json", {
  "/page": "app/page.js",
  "/explorer/page": "app/explorer/page.js",
  "/feed/route": "app/feed/route.js",
});
write(
  "server/app/page_client-reference-manifest.js",
  clientManifest("/page", {
    sync: {
      id: 1,
      name: "*",
      chunks: ["/_next/static/chunks/page.js"],
      async: false,
    },
    lazy: {
      id: 2,
      name: "*",
      chunks: ["/_next/static/chunks/lazy.js"],
      async: true,
    },
  }),
);
write(
  "server/app/explorer/page_client-reference-manifest.js",
  clientManifest("/explorer/page", {
    sync: {
      id: 3,
      name: "*",
      chunks: ["/_next/static/chunks/explorer.js"],
      async: false,
    },
  }),
);
for (const chunk of [
  "main.js",
  "polyfill.js",
  "page.js",
  "lazy.js",
  "explorer.js",
]) {
  write(`static/chunks/${chunk}`, `console.log(${JSON.stringify(chunk)});`);
}

afterAll(() => rmSync(dist, { recursive: true, force: true }));

describe("routePath", () => {
  it("drops the page suffix", () => {
    expect(routePath("/page")).toBe("/");
    expect(routePath("/explorer/page")).toBe("/explorer");
    expect(routePath("/accounts/[address]/page")).toBe("/accounts/[address]");
  });
});

describe("measureRoutes", () => {
  it("counts the shared runtime and the route's synchronous chunks", () => {
    const { routes } = measureRoutes(dist);
    expect(routes).toEqual({
      "/":
        gzipSize("static/chunks/main.js") + gzipSize("static/chunks/page.js"),
      "/explorer":
        gzipSize("static/chunks/main.js") +
        gzipSize("static/chunks/explorer.js"),
    });
  });

  it("leaves out polyfills, on-demand chunks and route handlers", () => {
    const { routes, chunksByRoute } = measureRoutes(dist);
    const counted = JSON.stringify(chunksByRoute);
    expect(counted).not.toContain("polyfill.js");
    expect(counted).not.toContain("lazy.js");
    expect(counted).not.toContain("feed");
    expect(Object.keys(routes).sort()).toEqual(["/", "/explorer"]);
  });
});

describe("compareRoutes", () => {
  it("passes a route inside its headroom", () => {
    const { rows, stale } = compareRoutes(
      { "/explorer": 1000 },
      { routes: { "/explorer": 900 }, headroom: 200 },
    );
    expect(rows).toEqual([
      {
        route: "/explorer",
        actual: 1000,
        baseline: 900,
        budget: 1100,
        delta: 100,
        status: "ok",
      },
    ]);
    expect(stale).toEqual([]);
  });

  it("fails a route past its headroom", () => {
    const { rows } = compareRoutes(
      { "/explorer": 1101 },
      { routes: { "/explorer": 900 }, headroom: 200 },
    );
    expect(rows[0].status).toBe("over");
    expect(rows[0].delta).toBe(201);
  });

  it("fails a route with no budget entry", () => {
    const { rows } = compareRoutes({ "/new": 10 }, { routes: {}, headroom: 0 });
    expect(rows[0]).toMatchObject({
      route: "/new",
      budget: null,
      delta: null,
      status: "unbudgeted",
    });
  });

  it("warns about budget entries whose route is gone", () => {
    const { stale } = compareRoutes({ "/": 1 }, { routes: { "/old": 1 } });
    expect(stale).toEqual(["/old"]);
  });

  it("falls back to the default headroom and orders routes by size", () => {
    const { rows, headroom } = compareRoutes(
      { "/small": 10, "/large": 100 },
      { routes: { "/small": 10, "/large": 100 } },
    );
    expect(headroom).toBe(5 * 1024);
    expect(rows.map((row) => row.route)).toEqual(["/large", "/small"]);
  });
});

describe("formatting", () => {
  it("writes sizes as decimal kB", () => {
    expect(formatKb(1500)).toBe("1.5 kB");
    expect(formatKb(0)).toBe("0.0 kB");
  });

  it("marks growth and unbudgeted routes", () => {
    expect(formatDelta(2048)).toBe("+2.0 kB");
    expect(formatDelta(-2048)).toBe("-2.0 kB");
    expect(formatDelta(0)).toBe("0.0 kB");
    expect(formatDelta(null)).toBe("new");
  });
});

describe("the report command", () => {
  function run(...args) {
    return spawnSync(process.execPath, [script, ...args], {
      encoding: "utf8",
      // Keep the suite from writing into a CI job's summary and annotations.
      env: { ...process.env, GITHUB_ACTIONS: "", GITHUB_STEP_SUMMARY: "" },
    });
  }

  it("refuses to guess when there is no budget to compare against", () => {
    const budget = path.join(dist, "absent.json");
    const result = run("--dist", dist, "--budget", budget);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("bundle:update");
  });

  it("records sizes, then checks them", () => {
    const budget = path.join(dist, "budget.json");
    const update = run("--dist", dist, "--budget", budget, "--update");
    expect(update.status).toBe(0);
    expect(update.stdout).toContain("Accepted 2 routes");

    const written = JSON.parse(readFileSync(budget, "utf8"));
    expect(written.headroomBytes).toBe(5 * 1024);
    expect(Object.keys(written.routes)).toEqual(["/", "/explorer"]);

    const check = run("--dist", dist, "--budget", budget);
    expect(check.status).toBe(0);
    expect(check.stdout).toContain("within budget");
    const report = JSON.parse(
      readFileSync(path.join(dist, "bundle-report.json"), "utf8"),
    );
    expect(report.headroomBytes).toBe(5 * 1024);
    expect(report.sharedBytes).toBe(gzipSize("static/chunks/main.js"));
    expect(report.routes["/"].status).toBe("ok");
    expect(report.routes["/"].chunks).toContain("static/chunks/main.js");
  });

  it("fails when a route grows past its budget", () => {
    const budget = path.join(dist, "budget.json");
    const written = JSON.parse(readFileSync(budget, "utf8"));
    written.headroomBytes = 0;
    written.routes["/explorer"] = 1;
    writeFileSync(budget, `${JSON.stringify(written, null, 2)}\n`);

    const check = run("--dist", dist, "--budget", budget);
    expect(check.status).toBe(1);
    expect(check.stderr).toContain("/explorer");
    expect(check.stdout).toContain("over");
  });
});
