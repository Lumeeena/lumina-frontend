/**
 * Request headers for the GraphQL Playground when the developer has pasted an
 * API key (#8).
 *
 * The key is a credential, so it is only ever sent as a bearer token to the
 * endpoint the playground already talks to. It is never written into the query
 * text, the query history, or any URL.
 */

const MAX_API_KEY_LENGTH = 256;
// Visible ASCII only: anything else (spaces, tabs, newlines, non-ASCII) cannot
// be carried in an HTTP header value, and would fail in a confusing way there.
const VISIBLE_ASCII = /^[\x21-\x7E]+$/;

/**
 * Explain why a key cannot be sent, or return null when it can. An empty key is
 * valid: it means "send the request unauthenticated".
 */
export function apiKeyProblem(apiKey: string): string | null {
  const key = apiKey.trim();
  if (key === "") return null;
  if (!VISIBLE_ASCII.test(key) || key.length > MAX_API_KEY_LENGTH) {
    return `An API key cannot contain spaces or control characters, and must be at most ${MAX_API_KEY_LENGTH} characters. Check what was pasted.`;
  }
  return null;
}

/**
 * Headers for a playground request. With no key the headers are exactly the
 * JSON content type, so an unauthenticated request is unchanged.
 */
export function playgroundHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = apiKey.trim();
  if (key !== "") {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

/**
 * A short form of the key for display, so the developer can confirm which key
 * is in use without the whole secret being on screen.
 */
export function maskApiKey(apiKey: string): string {
  const key = apiKey.trim();
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
