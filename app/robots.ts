import type { MetadataRoute } from "next";
import { CRAWL_EXCLUDED } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

/**
 * Where crawlers should and should not spend their budget.
 *
 * The site is a link hub: a handful of stable routes, and a long tail of
 * per-address pages underneath them. Without direction a crawler walks the long
 * tail — one fetch per Stellar address, forever — and the seven routes in the
 * sitemap never get looked at. So the long tail is excluded here and the stable
 * routes are pointed at explicitly in `app/sitemap.ts`.
 *
 * `robots.txt` governs crawling, not indexing. A blocked URL can still appear
 * in results from an external link, which is the right outcome for an account
 * page: it is worth surfacing to someone who searches for the address, and
 * worth not spending crawl capacity on. Hiding these pages from the index
 * instead would be worse on both counts — Google would still fetch each one in
 * order to read the `noindex` tag, and would drop the link.
 *
 * The patterns and the reasoning behind each are in `lib/routes.ts`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: CRAWL_EXCLUDED.map(({ pattern }) => pattern),
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
