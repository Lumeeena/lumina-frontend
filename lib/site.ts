/** Public origin, used for absolute URLs in the sitemap. Build-time inlined like the other NEXT_PUBLIC_* values. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
