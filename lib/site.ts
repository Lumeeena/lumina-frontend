/**
 * The site's own identity, in one place.
 *
 * Kept dependency-free so the sitemap, the robots file, the metadata builders
 * and the tests can all read it without pulling in anything else.
 */

/** Public origin, used for absolute URLs in the sitemap, canonical links and `og:url`. Build-time inlined like the other NEXT_PUBLIC_* values. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Product name, as it appears in titles, `og:site_name` and the share image. */
export const SITE_NAME = "Lumina";

/** The home page's title, which already carries the brand — so it is never suffixed again. */
export const SITE_TITLE = `${SITE_NAME} — Stellar Data Layer`;

/** One sentence about the product, for the routes that have nothing more specific to say. */
export const DEFAULT_DESCRIPTION =
  "Open-source event indexer and GraphQL data layer for the Stellar network.";
