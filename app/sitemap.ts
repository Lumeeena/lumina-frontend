import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** The stable routes only. Per-address pages under /accounts are unbounded and excluded (see robots.ts). */
const STABLE_ROUTES = ["/", "/explorer", "/transactions", "/events", "/graphql", "/registry", "/stats"];

export default function sitemap(): MetadataRoute.Sitemap {
  return STABLE_ROUTES.map(route => ({ url: `${SITE_URL}${route === "/" ? "" : route}` }));
}
