"use client";

import { useEffect, useState } from "react";
import { getLocale, setLocale } from "@/lib/i18n";

export const SUPPORTED_LOCALES = [
  "en",
  "zh",
  "ja",
  "ko",
  "ru",
  "ar",
  "he",
  "es",
  "pt",
];

export const LOCALE_META: Record<string, { label: string; nativeLabel: string; flag: string }> = {
  "en": { label: "English", nativeLabel: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  "zh": { label: "Chinese", nativeLabel: "中文", flag: "\u{1F1E8}\u{1F1F3}" },
  "ja": { label: "Japanese", nativeLabel: "日本語", flag: "\u{1F1EF}\u{1F1F5}" },
  "ko": { label: "Korean", nativeLabel: "한국어", flag: "\u{1F1F0}\u{1F1F7}" },
  "ru": { label: "Russian", nativeLabel: "Русский", flag: "\u{1F1F7}\u{1F1FA}" },
  "ar": { label: "Arabic", nativeLabel: "العربية", flag: "\u{1F1E6}\u{1F1F8}" },
  "he": { label: "Hebrew", nativeLabel: "עברית", flag: "\u{1F1EE}\u{1F1F1}" },
  "es": { label: "Spanish", nativeLabel: "Español", flag: "\u{1F1EA}\u{1F1F8}" },
  "pt": { label: "Portuguese", nativeLabel: "Português", flag: "\u{1F1E7}\u{1F1F7}" },
};

export default function LocaleSwitcher() {
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    setCurrentLocale(getLocale());
    const handleLocaleChange = () => {
      setCurrentLocale(getLocale());
    };
    // We would need to subscribe here if setLocale is called elsewhere, but
    // since we control the UI here, it's mostly self-contained.
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    setLocale(newLocale);
    setCurrentLocale(newLocale);
    
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("locale", newLocale);
    window.history.replaceState({}, "", url.toString());
    
    // Persist choice
    localStorage.setItem("lumina-locale", newLocale);
  };

  const meta = LOCALE_META[currentLocale] || LOCALE_META["en"];

  return (
    <div className="relative inline-flex items-center text-sm">
      <div className="pointer-events-none absolute left-2.5 flex items-center" aria-hidden="true">
        <span className="mr-1">{meta.flag}</span>
      </div>
      <select
        value={currentLocale}
        onChange={handleChange}
        aria-label="Select language"
        className="appearance-none rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] pl-8 pr-7 py-1.5 font-medium shadow-sm transition hover:border-[var(--color-accent-fill)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-fill)] cursor-pointer text-[var(--color-text-primary)]"
      >
        {SUPPORTED_LOCALES.map((loc) => {
          const m = LOCALE_META[loc];
          return (
            <option key={loc} value={loc} className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] py-1">
              {m.flag} {m.nativeLabel} ({m.label})
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute right-2 flex items-center opacity-50" aria-hidden="true">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
