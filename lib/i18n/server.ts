import { cookies, headers } from "next/headers";
import { createTranslator, resolveLocale, CATALOGUES } from "./index";

export const LOCALE_COOKIE = "lumina-locale";

/**
 * Parse an HTTP Accept-Language header into a quality-sorted array of lowercase language tags.
 * Excludes tags with q=0 and ignores malformed tags.
 */
export function parseAcceptLanguage(
  header: string | null | undefined,
): string[] {
  if (!header || typeof header !== "string") return [];

  const items: { tag: string; q: number }[] = [];
  const parts = header.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const segments = trimmed.split(";").map((s) => s.trim());
    const rawTag = segments[0];
    if (
      !rawTag ||
      rawTag === "*" ||
      !/^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/.test(rawTag)
    ) {
      continue;
    }

    let q = 1.0;
    for (let i = 1; i < segments.length; i++) {
      const qMatch = segments[i].match(/^q=(.*)$/i);
      if (qMatch) {
        const parsed = Number(qMatch[1].trim());
        q = !Number.isNaN(parsed) ? parsed : 0;
      }
    }

    if (q > 0) {
      items.push({ tag: rawTag.toLowerCase(), q: Math.min(q, 1.0) });
    }
  }

  items.sort((a, b) => b.q - a.q);
  return items.map((i) => i.tag);
}

/**
 * Match parsed language tags against available message catalogues.
 */
export function matchAcceptLanguage(
  header: string | null | undefined,
): string | null {
  const tags = parseAcceptLanguage(header);
  for (const tag of tags) {
    const norm = tag.trim().toLowerCase();
    if (norm in CATALOGUES) {
      return norm;
    }
    const base = norm.split(/[-_]/)[0];
    if (base in CATALOGUES) {
      return base;
    }
  }
  return null;
}

/**
 * Determine the locale for the current request.
 * Precedence:
 * 1. Locale cookie (if valid and supported)
 * 2. Accept-Language header (weighted match against available catalogues)
 * 3. Default "en"
 */
export async function getRequestLocale(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(LOCALE_COOKIE)?.value;
    if (cookieVal) {
      const decoded = decodeURIComponent(cookieVal);
      const canonical = resolveLocale(decoded);
      if (canonical in CATALOGUES) {
        return canonical;
      }
    }
  } catch {
    // Outside request context (e.g. static generation or test)
  }

  try {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language");
    const matched = matchAcceptLanguage(acceptLanguage);
    if (matched) {
      return matched;
    }
  } catch {
    // Outside request context
  }

  return "en";
}

/**
 * Create a request-scoped translator instance for Server Components.
 * Does not mutate shared module state.
 */
export async function getServerTranslator() {
  const locale = await getRequestLocale();
  return createTranslator(locale);
}
