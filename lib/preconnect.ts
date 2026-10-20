/**
 * The origins worth opening a connection to before the first request needs
 * them. Part of #251.
 *
 * DNS, TCP and TLS all happen on the first request to an origin. Those origins
 * are fixed per deployment (`NEXT_PUBLIC_GRAPHQL_URL`, `NEXT_PUBLIC_SOROBAN_RPC_URL`),
 * so a `<link rel="preconnect">` for each one can be rendered into the document
 * head and the handshake overlaps with the page's own work.
 *
 * Relative or non-HTTP URLs are skipped rather than failing the render: a
 * same-origin `/graphql` has nothing to preconnect to, and a malformed value in
 * an env var should not take the whole layout down with it.
 */
export function preconnectOrigins(urls: readonly string[]): string[] {
  const origins = new Set<string>();
  for (const url of urls) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    origins.add(parsed.origin);
  }
  return [...origins];
}
