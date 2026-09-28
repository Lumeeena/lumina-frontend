/**
 * Text direction for the active locale (#31).
 *
 * The message catalogue handles translated strings; this module handles the
 * layout mirroring that goes with them. RTL is derived from the language
 * subtag so a locale is supported for direction even before a full catalogue
 * exists (the strings fall back to English, the layout still mirrors).
 */

export type Direction = "ltr" | "rtl";

/** Languages written right-to-left. Extend as new locales are added. */
export const RTL_LANGUAGES: ReadonlySet<string> = new Set([
  "ar", // Arabic
  "ckb", // Central Kurdish
  "dv", // Divehi
  "fa", // Persian
  "he", // Hebrew
  "ku", // Kurdish
  "ps", // Pashto
  "sd", // Sindhi
  "ug", // Uyghur
  "ur", // Urdu
  "yi", // Yiddish
]);

/** Returns the writing direction for a BCP-47 locale (e.g. "ar-EG" → "rtl"). */
export function getDirection(locale: string): Direction {
  const language = locale.toLowerCase().split(/[-_]/)[0];
  return RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
}

/** True when the locale is written right-to-left. */
export function isRtl(locale: string): boolean {
  return getDirection(locale) === "rtl";
}
