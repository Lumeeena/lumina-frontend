import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { SITE_URL } from "./site";
import {
  CRAWL_EXCLUDED,
  HOME,
  INDEXABLE_ROUTES,
  NAV_ROUTES,
  STABLE_ROUTES,
  WATCHES,
} from "./routes";

describe("lib/routes", () => {
  it("gives every stable route a unique path, label, description, and explicit or default crawl policy", () => {
    const paths = new Set<string>();

    for (const route of STABLE_ROUTES) {
      expect(route.path).toMatch(/^\//);
      expect(paths.has(route.path)).toBe(false);
      paths.add(route.path);

      expect(route.label.trim().length).toBeGreaterThan(0);
      expect(route.description.trim().length).toBeGreaterThan(10);
      expect(
        route.indexable === undefined || typeof route.indexable === "boolean",
      ).toBe(true);
    }
  });

  it("derives INDEXABLE_ROUTES and NAV_ROUTES from STABLE_ROUTES", () => {
    expect(INDEXABLE_ROUTES).toEqual(
      STABLE_ROUTES.filter((route) => route.indexable !== false),
    );
    expect(INDEXABLE_ROUTES).not.toContain(WATCHES);

    expect(NAV_ROUTES).toEqual(
      STABLE_ROUTES.filter((route) => route.path !== HOME.path),
    );
    expect(NAV_ROUTES).not.toContain(HOME);
    expect(NAV_ROUTES).toContain(WATCHES);
  });

  it("documents every crawl exclusion pattern with a reason", () => {
    expect(CRAWL_EXCLUDED.length).toBeGreaterThan(0);
    for (const exclusion of CRAWL_EXCLUDED) {
      expect(exclusion.pattern).toMatch(/^\//);
      expect(exclusion.reason.trim().length).toBeGreaterThan(15);
    }
  });

  it("drives the sitemap and robots.txt disallow rules from the route inventory", () => {
    const sitemapUrls = sitemap().map((entry) => entry.url);
    expect(sitemapUrls).toEqual(
      INDEXABLE_ROUTES.map(
        (route) => `${SITE_URL}${route.path === "/" ? "" : route.path}`,
      ),
    );

    const robotRules = robots().rules;
    const primaryRule = Array.isArray(robotRules) ? robotRules[0] : robotRules;
    expect(primaryRule.disallow).toEqual(
      CRAWL_EXCLUDED.map((entry) => entry.pattern),
    );
  });
});
