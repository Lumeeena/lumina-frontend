/**
 * The feedback link: where a user reports a problem, and what the report
 * carries with it.
 *
 * Only two things are prefilled — the route and the app version — because they
 * are what a maintainer needs to reproduce a bug and neither identifies anyone.
 * The route is the path alone, never the query string, and any Stellar address
 * in it is redacted: `/accounts/G…` is the one place a wallet can show up in a
 * URL, and the report must not carry it.
 */

export const ISSUE_TRACKER_URL =
  "https://github.com/Lumeeena/lumina-frontend/issues/new";

// Stellar strkeys: G… accounts, C… contracts, M… muxed accounts and S… secrets
// are all base32 with a one-letter prefix, so a path segment that matches is a
// key even when it sits in a route we do not know about.
const STELLAR_KEY = /\b[GCMS][A-Z2-7]{55,68}\b/g;

/** The path with every Stellar key replaced, so no wallet reaches the tracker. */
export function sanitizeRoute(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] || "/";
  return path.replace(STELLAR_KEY, ":redacted");
}

/** The tracker's new-issue form, prefilled with the route and app version. */
export function buildFeedbackUrl({
  pathname,
  appVersion,
}: {
  pathname: string;
  appVersion: string;
}): string {
  const route = sanitizeRoute(pathname);
  const params = new URLSearchParams({
    title: `Feedback on ${route}`,
    body: [
      "**What happened:**",
      "",
      "**Steps to reproduce:**",
      "",
      "---",
      `Route: ${route}`,
      `App version: v${appVersion}`,
    ].join("\n"),
    labels: "feedback",
  });
  return `${ISSUE_TRACKER_URL}?${params.toString()}`;
}
