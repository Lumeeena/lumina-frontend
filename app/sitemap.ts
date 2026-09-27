import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

/**
 * The sitemap: the short, fixed list of routes, and nothing else.
 *
 * What is deliberately not here:
 *
 * - **Per-address pages.** `/accounts/[address]` is one page per Stellar
 *   address — the set is unbounded, and a sitemap is a request to fetch
 *   everything in it. A crawler that works through thousands of account pages
 *   never reaches `/stats`. `app/robots.ts` keeps it out of crawls instead.
 * - **Filter permutations.** `/transactions?status=failed` and
 *   `/events?contractId=C…` are views of a route that is already listed, not
 *   pages of their own. Each declares `/transactions` or `/events` as its
 *   canonical URL.
 * - **`lastModified`.** Nothing here records when a page's content last
 *   changed, and the honest answer — the indexed data changes with every
 *   ledger — is not a useful signal. Google's own guidance is to leave the tag
 *   out rather than publish a value that is always wrong; a crawler that
 *   distrusts `lastmod` starts ignoring the whole file.
 *
 * - **`/watch`.** It renders from the visitor's own localStorage, so a crawler
 *   gets the empty state. It is in the nav, and a route marked `indexable:
 *   false` in the inventory is what keeps the two from having to agree by
 *   accident.
 *
 * The route list itself comes from `lib/routes.ts`, which is the same list the
 * nav renders, so a new page cannot ship without appearing here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map(route => ({
    // The trailing slash of the origin is trimmed, so the home page's URL is
    // the bare origin rather than a doubled slash.
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
  }));
}
