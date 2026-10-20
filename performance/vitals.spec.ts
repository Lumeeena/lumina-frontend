import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { STABLE_ROUTES } from "../lib/routes";

const resolveModule = createRequire(path.join(process.cwd(), "package.json"));
const library = readFileSync(
  path.join(
    path.dirname(resolveModule.resolve("web-vitals")),
    "web-vitals.iife.js",
  ),
  "utf8",
);
const account = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const routes = [
  ...STABLE_ROUTES.map((route) => ({ route: route.path, path: route.path })),
  { route: "/accounts", path: "/accounts" },
  { route: "/accounts/[address]", path: `/accounts/${account}` },
  {
    route: "/transactions/[hash]",
    path: `/transactions/${"1".padStart(64, "0")}`,
  },
  { route: "/assets/[code]/[issuer]", path: "/assets/XLM/native" },
  {
    route: "/contracts/[contractId]",
    path: "/contracts/CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ",
  },
  { route: "/developers/getting-started", path: "/developers/getting-started" },
  {
    route: "/developers/interactive-docs",
    path: "/developers/interactive-docs",
  },
  { route: "/developers/usage", path: "/developers/usage" },
];

test("every built page has a representative vitals journey", () => {
  if (process.env.VITALS_REFERENCE_RUN === "1") return;
  const manifest = JSON.parse(
    readFileSync(
      path.join(
        process.env.VITALS_APP_DIR ?? process.cwd(),
        ".next/server/app-paths-manifest.json",
      ),
      "utf8",
    ),
  );
  const built = Object.keys(manifest)
    .filter((key) => key.endsWith("/page") && !key.startsWith("/_"))
    .map((key) => key.slice(0, -5) || "/")
    .sort();
  expect(routes.map((item) => item.route).sort()).toEqual(built);
});

for (const route of routes) {
  test(`vitals ${route.route}`, async ({ browser }, testInfo) => {
    if (process.env.VITALS_REFERENCE_RUN === "1") {
      const manifest = JSON.parse(
        readFileSync(
          path.join(
            process.env.VITALS_APP_DIR!,
            ".next/server/app-paths-manifest.json",
          ),
          "utf8",
        ),
      );
      test.skip(
        !manifest[`${route.route === "/" ? "" : route.route}/page`],
        "The candidate added this route; it has no base measurement",
      );
    }
    const samples: Record<string, number>[] = [];
    for (let sample = 0; sample < 3; sample++) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        locale: "en-US",
        timezoneId: "UTC",
        serviceWorkers: "block",
      });
      try {
        await context.addInitScript({
          content: `${library}
          (() => {
            const metrics = {};
            const record = metric => { metrics[metric.name] = metric.value; };
            webVitals.onLCP(record, { reportAllChanges: true });
            webVitals.onCLS(record, { reportAllChanges: true });
            webVitals.onINP(record, { reportAllChanges: true });
            addEventListener('pagehide', () => localStorage.setItem('lumina-vitals', JSON.stringify(metrics)));
          })();`,
        });
        const page = await context.newPage();
        const response = await page.goto(`http://127.0.0.1:3200${route.path}`);
        expect(response?.ok()).toBe(true);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000);
        const theme = page.getByRole("button", {
          name: /Current:.*Click to switch/i,
        });
        const before = await theme.getAttribute("aria-label");
        await theme.click();
        await expect(theme).not.toHaveAttribute("aria-label", before!);
        await page.keyboard.press("Tab");
        await page.waitForTimeout(300);
        // A real navigation flushes CLS and INP on visibilitychange/pagehide.
        // Missing metrics stay missing; INP is never replaced with TBT or zero.
        await page.goto("http://127.0.0.1:3200/robots.txt");
        const metrics = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("lumina-vitals") ?? "{}"),
        );
        for (const name of ["LCP", "CLS", "INP"])
          expect(
            Number.isFinite(metrics[name]),
            `${route.route}: missing ${name}`,
          ).toBe(true);
        samples.push(metrics);
      } finally {
        await context.close();
      }
    }
    await testInfo.attach("web-vitals", {
      body: JSON.stringify({ route: route.route, samples }),
      contentType: "application/json",
    });
  });
}
