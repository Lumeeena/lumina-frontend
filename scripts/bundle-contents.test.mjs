import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sourcePackages, inspectContents } from "./bundle-contents.mjs";

let dist;
const rules = [
  {
    package: "@creit.tech/stellar-wallets-kit",
    allowedRoutes: [],
    reason: "Interaction only",
  },
];
function write(file, data) {
  const target = path.join(dist, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, typeof data === "string" ? data : JSON.stringify(data));
}
beforeEach(() => {
  dist = mkdtempSync(path.join(os.tmpdir(), "lumina-contents-"));
  write("build-manifest.json", { rootMainFiles: ["static/chunks/runtime.js"] });
  write("server/app-paths-manifest.json", {
    "/page": "app/page.js",
    "/graphql/page": "app/graphql/page.js",
  });
  for (const key of ["/page", "/graphql/page"]) {
    write(
      `server/app${key.replace(/page$/, "page_client-reference-manifest.js")}`,
      `globalThis.__RSC_MANIFEST = {${JSON.stringify(key)}: {clientModules: {
        sync: {chunks: ["static/chunks/route.js"], async: false},
        lazy: {chunks: ["static/chunks/wallet.js"], async: true}
      }}};`,
    );
  }
  for (const chunk of ["runtime", "route", "wallet"]) {
    write(`static/chunks/${chunk}.js`, "console.log(1)");
    write(`static/chunks/${chunk}.js.map`, {
      sources: [
        chunk === "wallet"
          ? "webpack://app/./node_modules/@creit.tech/stellar-wallets-kit/index.js"
          : "turbopack:///[project]/node_modules/react/index.js",
      ],
    });
  }
  write("rules.json", { rules });
});
afterEach(() => rmSync(dist, { recursive: true, force: true }));

describe("bundle module inventory", () => {
  it("reads scoped, nested, Windows and indexed source paths", () => {
    expect(
      sourcePackages({
        sources: [
          "webpack:///./node_modules/recharts/lib/chart.js",
          "C:\\project\\node_modules\\@uiw\\react-codemirror\\index.js",
          "/node_modules/outer/node_modules/inner/index.js",
          "app/not-a-package.js",
        ],
        sections: [
          {
            map: {
              sources: [
                "turbopack:///[project]/node_modules/@stellar/stellar-sdk/lib/index.js",
              ],
            },
          },
        ],
      }),
    ).toEqual([
      "@stellar/stellar-sdk",
      "@uiw/react-codemirror",
      "inner",
      "outer",
      "recharts",
    ]);
  });

  it("ignores deferred chunks and reports first-load modules", () => {
    const result = inspectContents(dist, rules);
    expect(result.violations).toEqual([]);
    expect(result.packagesByRoute).toEqual({
      "/": ["react"],
      "/graphql": ["react"],
    });
    expect(result.packagesByChunk).not.toHaveProperty(
      "static/chunks/wallet.js",
    );
  });

  it("follows independently hashed sourceMappingURL references from Turbopack", () => {
    write(
      "static/chunks/route.js",
      "console.log(1);\n//# sourceMappingURL=other-hash.js.map\n",
    );
    write("static/chunks/other-hash.js.map", {
      sources: ["/node_modules/recharts/index.js"],
    });
    expect(inspectContents(dist, rules).packagesByRoute["/"]).toContain(
      "recharts",
    );
  });

  it("fails the command when a heavy dependency enters a shared initial chunk, even below the size budget", () => {
    write("static/chunks/runtime.js.map", {
      sources: ["/node_modules/@creit.tech/stellar-wallets-kit/index.js"],
    });
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL("./bundle-contents.mjs", import.meta.url)),
        dist,
        path.join(dist, "rules.json"),
      ],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stderr, JSON.stringify(result)).toContain(
      "forbidden initial dependency @creit.tech/stellar-wallets-kit",
    );
    expect(
      JSON.parse(readFileSync(path.join(dist, "bundle-contents.json")))
        .violations,
    ).toHaveLength(2);
  });

  it("allows a package only on its designated route", () => {
    write("static/chunks/route.js.map", {
      sources: ["/node_modules/@uiw/react-codemirror/index.js"],
    });
    expect(
      inspectContents(dist, [
        { package: "@uiw/react-codemirror", allowedRoutes: ["/graphql"] },
      ]).violations,
    ).toEqual([
      {
        route: "/",
        package: "@uiw/react-codemirror",
        allowedRoutes: ["/graphql"],
      },
    ]);
  });

  it("fails closed when build maps are missing instead of silently approving empty contents", () => {
    rmSync(path.join(dist, "static/chunks/route.js.map"));
    expect(() => inspectContents(dist, rules)).toThrow(
      "Missing or invalid source map",
    );
  });
});
