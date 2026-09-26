import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Account pages are one per address — an unbounded set that a crawler would
 * otherwise spend its whole budget on. Everything else is a small, fixed set
 * of routes that is listed in the sitemap instead.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/accounts/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
