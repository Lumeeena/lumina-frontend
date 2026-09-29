/**
 * Lightweight i18n for user-facing strings.
 *
 * The catalogue is a flat key → template-string map. Templates use `{name}`
 * placeholders and `{name, plural, one {…} other {…}}` for simple
 * pluralisation. No ICU parser is needed because the grammar is constrained
 * to these two forms and the catalogue is validated at build time by
 * TypeScript (every key must exist).
 *
 * Technical detail (error digests, status codes, contract IDs) stays
 * untranslated: it is passed through the `{…}` interpolation slots so the
 * translated sentence wraps it rather than replacing it.
 *
 * To add a locale, create `lib/i18n/<code>.ts` exporting a
 * `MessageCatalogue`, import it here and add it to `CATALOGUES`.
 * See docs/TRANSLATION.md for the full guide.
 */
import type { MessageCatalogue, MessageKey } from "./types";
import en from "./en";
import de from "./de";
import { getDirection, isRtl, RTL_LANGUAGES, type Direction } from "./direction";

const CATALOGUES: Record<string, MessageCatalogue> = { en, de };

let activeCatalogue: MessageCatalogue = en;
let activeLocale = "en";

type LocaleListener = (locale: string) => void;
const localeListeners = new Set<LocaleListener>();

function baseLanguage(locale: string): string {
  return locale.toLowerCase().split(/[-_]/)[0];
}

/**
 * A locale is supported when it has a message catalogue or it is a known RTL
 * language (which needs the document to mirror even before its strings are
 * translated). Anything else is ignored so an unknown code never silently
 * switches the app away from English.
 */
export function isSupportedLocale(locale: string): boolean {
  return locale in CATALOGUES || RTL_LANGUAGES.has(baseLanguage(locale));
}

/**
 * Switch the active locale. Falls back to English strings for locales without
 * a catalogue, but still records the locale so the document direction (and
 * language) reflect it. Unknown locales are ignored.
 */
export function setLocale(locale: string): void {
  if (!isSupportedLocale(locale)) return;
  const catalogue = CATALOGUES[locale];
  if (catalogue) {
    activeCatalogue = catalogue;
  }
  activeLocale = locale;
  for (const listener of localeListeners) listener(activeLocale);
}

export function getLocale(): string {
  return activeLocale;
}

/** Direction ("ltr" | "rtl") for the active locale. */
export function getLocaleDirection(): Direction {
  return getDirection(activeLocale);
}

/** True when the active locale is written right-to-left. */
export function isActiveLocaleRtl(): boolean {
  return isRtl(activeLocale);
}

/** Subscribe to locale changes (e.g. to mirror the document `<html>`). */
export function subscribeLocale(listener: LocaleListener): () => void {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

/**
 * Look up a translated message and interpolate placeholders.
 *
 * ```ts
 * t("error.failedToLoadRoute", { route: "Explorer" })
 * // → "Failed to load Explorer"
 *
 * t("watch.watchedAddresses", { count: 3 })
 * // → "3 watched addresses"
 * ```
 *
 * Unknown keys return the key itself so a missing translation is visible
 * without crashing.
 */
export function t(
  key: MessageKey,
  values?: Record<string, string | number | bigint>,
): string {
  const template = activeCatalogue[key] ?? key;
  if (!values) return template;
  return interpolate(template, values);
}

/**
 * Replace `{name}` placeholders and expand `{name, plural, one {…} other {…}}`
 * blocks.
 *
 * Plural blocks use a brace-counting scan so nested `{…}` in the branch
 * text is handled correctly.
 */
function interpolate(
  template: string,
  values: Record<string, string | number | bigint>,
): string {
  // First pass: expand plural blocks, which contain nested braces.
  let result = expandPlurals(template, values);
  // Second pass: simple {name} placeholders.
  result = result.replace(
    /\{(\w+)\}/g,
    (_match, name: string) => {
      const val = values[name];
      return val !== undefined ? String(val) : `{${name}}`;
    },
  );
  return result;
}

/**
 * Find `{name, plural, one {…} other {…}}` and replace each with the
 * correct branch.
 */
function expandPlurals(
  template: string,
  values: Record<string, string | number | bigint>,
): string {
  const re = /\{(\w+),\s*plural,\s*/g;
  let match: RegExpExecArray | null;
  let out = "";
  let last = 0;

  while ((match = re.exec(template)) !== null) {
    out += template.slice(last, match.index);
    const name = match[1];
    const val = values[name];
    const n = typeof val === "bigint" ? Number(val) : Number(val);

    // Parse branches inside the plural block by counting braces.
    const branches: Record<string, string> = {};
    let pos = match.index + match[0].length;
    while (pos < template.length && template[pos] !== "}") {
      // Skip whitespace.
      while (pos < template.length && /\s/.test(template[pos])) pos++;
      if (template[pos] === "}") break;
      // Read branch name (e.g. "one", "other").
      const branchStart = pos;
      while (pos < template.length && /\w/.test(template[pos])) pos++;
      const branchName = template.slice(branchStart, pos);
      // Skip whitespace before opening brace.
      while (pos < template.length && /\s/.test(template[pos])) pos++;
      if (template[pos] !== "{") break;
      pos++; // skip {
      let depth = 1;
      const contentStart = pos;
      while (pos < template.length && depth > 0) {
        if (template[pos] === "{") depth++;
        else if (template[pos] === "}") depth--;
        if (depth > 0) pos++;
      }
      branches[branchName] = template.slice(contentStart, pos);
      pos++; // skip closing }
    }
    // Skip the outer closing }.
    if (pos < template.length && template[pos] === "}") pos++;

    out += n === 1 && branches["one"] ? branches["one"] : (branches["other"] ?? String(n));
    last = pos;
    re.lastIndex = pos;
  }

  out += template.slice(last);
  return out;
}

export type { MessageCatalogue, MessageKey };
export { getDirection, isRtl, type Direction } from "./direction";
