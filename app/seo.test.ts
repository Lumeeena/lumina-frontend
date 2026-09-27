/**
 * The crawling surface: sitemap.xml, robots.txt, and the route list they are
 * built from.
 *
 * These are the files a crawler reads instead of the pages, so nothing in the
 * app's own tests can catch them being wrong. The assertions that matter most
 * are the negative ones — a route that should not be crawled, or should not be
 * listed, appearing anyway.
 */
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { CRAWL_EXCLUDED, HOME, INDEXABLE_ROUTES, NAV_ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

describe("sitemap", () => {
  it("lists every indexable route exactly once, at an absolute URL", () => {
    const urls = sitemap().map(entry => entry.url);

    expect(urls).toEqual(INDEXABLE_ROUTES.map(route => `${SITE_URL}${route.path === "/" ? "" : route.path}`));
    expect(new Set(urls).size).toBe(urls.length);
    // A relative or schemeless URL is silently dropped by every crawler.
    for (const url of urls) expect(url).toMatch(/^https?:\/\//);
  });

  it("includes the nav routes, so the two cannot drift", () => {
    const paths = sitemap().map(entry => new URL(entry.url).pathname || "/");

    for (const route of INDEXABLE_ROUTES) expect(paths).toContain(route.path);
    // A nav route only has to be in the sitemap if it has anything to crawl, so
    // a route absent from both is a drift and a route present in the nav but
    // marked `indexable: false` is deliberate.
    for (const route of NAV_ROUTES) {
      if (route.indexable === false) continue;
      expect(paths).toContain(route.path);
    }
  });

  it("keeps a page that renders from localStorage out of the sitemap", () => {
    // `/watch` is built entirely from the visitor's own watch list, so a
    // crawler would only ever index the empty state.
    const paths = sitemap().map(entry => new URL(entry.url).pathname || "/");

    expect(paths).not.toContain("/watch");
    expect(NAV_ROUTES.map(route => route.path)).toContain("/watch");
  });

  it("omits the per-address pages, which are unbounded", () => {
    const xml = JSON.stringify(sitemap());

    // A sitemap is a request to fetch everything in it. Listing account pages
    // would be an open-ended commitment on a set with no end.
    expect(xml).not.toContain("/accounts/");
  });

  it("omits query permutations, which are views rather than pages", () => {
    expect(JSON.stringify(sitemap())).not.toContain("?");
  });

  it("does not claim a lastmod it cannot keep honest", () => {
    // The indexed data changes with every ledger, so any lastmod published here
    // would be wrong within seconds — and a crawler that distrusts it starts
    // ignoring the file.
    for (const entry of sitemap()) expect(entry.lastModified).toBeUndefined();
  });
});

describe("robots.txt", () => {
  it("allows the stable routes and points at the sitemap", () => {
    const rules = robots().rules;

    expect(rules).toHaveLength(1);
    expect(rules[0].userAgent).toBe("*");
    expect(rules[0].allow).toBe("/");
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("keeps crawlers out of the per-address pages", () => {
    expect(robots().rules[0].disallow).toContain("/accounts/");
  });

  it("keeps crawlers out of filter and search permutations", () => {
    // Same content as the canonical route, so crawling them multiplies the URL
    // space for nothing.
    expect(robots().rules[0].disallow).toContain("/*?");
  });

  it("carries a reason for every exclusion", () => {
    // A disallow with no stated reason is the kind of rule that gets deleted by
    // the next person who does not know why it is there.
    for (const { pattern, reason } of CRAWL_EXCLUDED) {
      expect(reason.length).toBeGreaterThan(20);
      expect(robots().rules[0].disallow).toContain(pattern);
    }
  });

  it("does not block the home page through a prefix rule", () => {
    // `/accounts/` is a directory prefix, not a substring match — it must not
    // exclude `/accounts` itself, which is where the address search lives.
    const patterns = robots().rules[0].disallow ?? [];
    expect(patterns).not.toContain("/");
    expect(patterns.some(p => p === HOME.path)).toBe(false);
  });
});
