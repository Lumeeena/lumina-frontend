import { describe, expect, it, afterEach } from "vitest";
import { t, setLocale, getLocale, interpolate } from "./index";
import type { MessageKey } from "./types";

afterEach(() => setLocale("en"));

describe("t()", () => {
  it("returns a plain message", () => {
    expect(t("error.retry")).toBe("Retry");
  });

  it("interpolates simple placeholders", () => {
    expect(t("error.failedToLoadRoute", { route: "Explorer" })).toBe(
      "Failed to load Explorer",
    );
  });

  it("interpolates multiple placeholders", () => {
    expect(t("explorer.filteredCount", { filtered: 12, total: 200 })).toBe(
      "12 of 200 loaded",
    );
  });

  it("handles plural — one", () => {
    expect(t("watch.watchedAddresses", { count: 1 })).toBe("1 watched address");
  });

  it("handles plural — other", () => {
    expect(t("watch.watchedAddresses", { count: 5 })).toBe(
      "5 watched addresses",
    );
  });

  it("returns the key for an unknown message", () => {
    // @ts-expect-error — intentionally passing an invalid key
    expect(t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("leaves unmatched placeholders intact", () => {
    expect(t("error.failedToLoadRoute")).toBe("Failed to load {route}");
  });
});

describe("setLocale / getLocale", () => {
  it("defaults to English", () => {
    expect(getLocale()).toBe("en");
  });

  it("stays on English for an unknown locale", () => {
    setLocale("xx");
    expect(getLocale()).toBe("en");
  });
});

describe("multiple plural forms (Unicode CLDR)", () => {
  const polishTemplate =
    "{count, plural, one {1 plik} few {{count} pliki} many {{count} plików} other {{count} pliku}}";

  it("handles Polish plural categories (0, 1, 2, 5, 12, 22, 1.5)", () => {
    expect(interpolate(polishTemplate, { count: 0 }, "pl")).toBe("0 plików"); // many
    expect(interpolate(polishTemplate, { count: 1 }, "pl")).toBe("1 plik"); // one
    expect(interpolate(polishTemplate, { count: 2 }, "pl")).toBe("2 pliki"); // few
    expect(interpolate(polishTemplate, { count: 5 }, "pl")).toBe("5 plików"); // many
    expect(interpolate(polishTemplate, { count: 12 }, "pl")).toBe("12 plików"); // many
    expect(interpolate(polishTemplate, { count: 22 }, "pl")).toBe("22 pliki"); // few
    expect(interpolate(polishTemplate, { count: 1.5 }, "pl")).toBe("1.5 pliku"); // other
  });

  const arabicTemplate =
    "{count, plural, zero {صفر} one {كتاب واحد} two {كتابان} few {{count} كتب} many {{count} كتابا} other {{count} كتاب}}";

  it("handles Arabic plural categories (0, 1, 2, 3, 11, 100) via interpolate", () => {
    expect(interpolate(arabicTemplate, { count: 0 }, "ar")).toBe("صفر"); // zero
    expect(interpolate(arabicTemplate, { count: 1 }, "ar")).toBe("كتاب واحد"); // one
    expect(interpolate(arabicTemplate, { count: 2 }, "ar")).toBe("كتابان"); // two
    expect(interpolate(arabicTemplate, { count: 3 }, "ar")).toBe("3 كتب"); // few
    expect(interpolate(arabicTemplate, { count: 11 }, "ar")).toBe("11 كتابا"); // many
    expect(interpolate(arabicTemplate, { count: 100 }, "ar")).toBe("100 كتاب"); // other
  });

  it("handles Arabic plural categories via setLocale and t()", () => {
    setLocale("ar");
    expect(getLocale()).toBe("ar");
    expect(t(arabicTemplate as unknown as MessageKey, { count: 0 })).toBe(
      "صفر",
    );
    expect(t(arabicTemplate as unknown as MessageKey, { count: 1 })).toBe(
      "كتاب واحد",
    );
    expect(t(arabicTemplate as unknown as MessageKey, { count: 2 })).toBe(
      "كتابان",
    );
    expect(t(arabicTemplate as unknown as MessageKey, { count: 3 })).toBe(
      "3 كتب",
    );
    expect(t(arabicTemplate as unknown as MessageKey, { count: 11 })).toBe(
      "11 كتابا",
    );
    expect(t(arabicTemplate as unknown as MessageKey, { count: 100 })).toBe(
      "100 كتاب",
    );
  });

  it("falls back to other when an active plural category is omitted from the template", () => {
    const template = "{count, plural, one {one item} other {{count} items}}";
    // 5 in Polish would select "many", but since "many" is not defined, it falls back to "other"
    expect(interpolate(template, { count: 5 }, "pl")).toBe("5 items");
    // 2 in Arabic would select "two", but falls back to "other"
    expect(interpolate(template, { count: 2 }, "ar")).toBe("2 items");
  });

  it("guards against invalid locale tags with fallback to English plural rules", () => {
    const template = "{count, plural, one {one} other {other}}";
    expect(interpolate(template, { count: 1 }, "invalid-locale-tag!@#")).toBe(
      "one",
    );
    expect(interpolate(template, { count: 2 }, "invalid-locale-tag!@#")).toBe(
      "other",
    );
  });

  it("preserves nested interpolation in all expanded plural branches", () => {
    const template =
      "{count, plural, zero {Zero {item}} one {One {item}} few {Few {item}} many {Many {item}} other {Other {item}}}";
    expect(interpolate(template, { count: 0, item: "files" }, "ar")).toBe(
      "Zero files",
    );
    expect(interpolate(template, { count: 1, item: "file" }, "pl")).toBe(
      "One file",
    );
    expect(interpolate(template, { count: 2, item: "files" }, "pl")).toBe(
      "Few files",
    );
    expect(interpolate(template, { count: 5, item: "files" }, "pl")).toBe(
      "Many files",
    );
  });
});
