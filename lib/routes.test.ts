import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import * as routes from "./routes";
import type { RouteInfo } from "./routes";

/**
 * Whether a robots.txt rule matches a URL path. A rule is a prefix, and `*` is
 * a wildcard, which is how Google and Bing read it.
 */
function robotsRuleMatches(pattern: string, path: string): boolean {
  const body = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}`).test(path);
}

// Every route the module declares, found by shape rather than by name, so a new
// `export const FOO: RouteInfo` that is never added to STABLE_ROUTES fails here.
const declared = Object.values(routes).filter(
  (value): value is RouteInfo =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "path" in value,
);

describe("route inventory", () => {
  it("lists every declared route, so none ships without reaching the nav and sitemap", () => {
    expect(declared.length).toBeGreaterThan(0);
    for (const route of declared) expect(routes.STABLE_ROUTES).toContain(route);
    expect(routes.STABLE_ROUTES).toHaveLength(declared.length);
  });

  it("gives every route a well-formed path, a label and a description", () => {
    for (const route of routes.STABLE_ROUTES) {
      expect(route.path, route.path).toMatch(/^\/[a-z]*$/);
      expect(route.label.trim(), route.path).not.toBe("");
      expect(route.description.trim().length, route.path).toBeGreaterThan(20);
    }
  });

  it("keeps every path and every label unique", () => {
    const paths = routes.STABLE_ROUTES.map((route) => route.path);
    const labels = routes.STABLE_ROUTES.map((route) => route.label);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("keeps the home page out of the nav, because the wordmark links to it", () => {
    expect(routes.NAV_ROUTES).toEqual(
      routes.STABLE_ROUTES.filter((route) => route.path !== "/"),
    );
  });
});

describe("crawl policy", () => {
  it("indexes a route unless it says otherwise", () => {
    expect(routes.INDEXABLE_ROUTES).toEqual(
      routes.STABLE_ROUTES.filter((route) => route.indexable !== false),
    );
  });

  it("excludes only the watch page, which renders from the visitor's own storage", () => {
    // Its content is the empty state for any crawler, so it stays in the nav
    // but is not offered to search engines.
    expect(
      routes.STABLE_ROUTES.filter((route) => route.indexable === false).map(
        (route) => route.path,
      ),
    ).toEqual(["/watch"]);
  });

  it("matches robots prefixes the way crawlers do", () => {
    // Guards the helper below: a matcher that always answered false would let
    // the next test pass for any inventory at all.
    expect(robotsRuleMatches("/accounts/", "/accounts/GABC")).toBe(true);
    expect(robotsRuleMatches("/accounts/", "/accounts")).toBe(false);
    expect(robotsRuleMatches("/*?", "/transactions?status=failed")).toBe(true);
    expect(robotsRuleMatches("/*?", "/transactions")).toBe(false);
  });

  it("never disallows a route the sitemap lists", () => {
    const patterns = routes.CRAWL_EXCLUDED.map(({ pattern }) => pattern);
    for (const route of routes.INDEXABLE_ROUTES) {
      const blocking = patterns.filter((pattern) =>
        robotsRuleMatches(pattern, route.path),
      );
      expect(blocking, route.path).toEqual([]);
    }
  });

  it("derives the sitemap and robots lists from the inventory", () => {
    expect(sitemap().map((entry) => new URL(entry.url).pathname)).toEqual(
      routes.INDEXABLE_ROUTES.map((route) => route.path),
    );
    expect(robots().rules[0].disallow).toEqual(
      routes.CRAWL_EXCLUDED.map(({ pattern }) => pattern),
    );
  });
});
