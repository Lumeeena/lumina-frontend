import { describe, expect, it, afterEach } from "vitest";
import { t, setLocale, getLocale } from "./index";

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
    expect(
      t("explorer.filteredCount", { filtered: 12, total: 200 }),
    ).toBe("12 of 200 loaded");
  });

  it("handles plural — one", () => {
    expect(t("watch.watchedAddresses", { count: 1 })).toBe(
      "1 watched address",
    );
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
