// Strkey addresses are 56 characters today. The small tolerance also scrubs
// malformed/truncated addresses that may appear in an exception message.
const STELLAR_ADDRESS = /\b[CG][A-Z2-7]{50,60}\b/g;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export const REDACTED = "[redacted]";

export interface ReportedError {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
  source: "boundary" | "error" | "unhandledrejection";
  url?: string;
}

function scrubText(value: string): string {
  return value
    .replace(STELLAR_ADDRESS, REDACTED)
    .replace(EMAIL, REDACTED)
    .replace(IPV4, REDACTED);
}

/** Remove identifiers and URL query data before an error leaves the browser. */
export function sanitizeError(
  error: unknown,
  source: ReportedError["source"],
): ReportedError {
  const normalized =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unknown error");
  const location = typeof window === "undefined" ? undefined : window.location;

  return {
    name: scrubText(normalized.name),
    message: scrubText(normalized.message),
    ...(normalized.stack ? { stack: scrubText(normalized.stack) } : {}),
    ...(typeof (normalized as Error & { digest?: string }).digest === "string"
      ? { digest: scrubText((normalized as Error & { digest: string }).digest) }
      : {}),
    source,
    ...(location
      ? { url: scrubText(`${location.origin}${location.pathname}`) }
      : {}),
  };
}

/**
 * Send a privacy-filtered report when an endpoint is configured. Reporting is
 * deliberately disabled by default and must never cause a second app error.
 */
export async function reportError(
  error: unknown,
  source: ReportedError["source"],
): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_URL;
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sanitizeError(error, source),
        release: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
      }),
      keepalive: true,
    });
  } catch {
    // Observability is best-effort and must not interfere with recovery UI.
  }
}
