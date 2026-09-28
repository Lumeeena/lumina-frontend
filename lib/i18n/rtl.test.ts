import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLocale,
  getLocaleDirection,
  isActiveLocaleRtl,
  isSupportedLocale,
  setLocale,
  subscribeLocale,
  t,
} from "./index";

afterEach(() => setLocale("en"));

describe("RTL locale switching (#31)", () => {
  it("records an RTL locale and reports rtl direction", () => {
    setLocale("ar");

    expect(getLocale()).toBe("ar");
    expect(getLocaleDirection()).toBe("rtl");
    expect(isActiveLocaleRtl()).toBe(true);
  });

  it("falls back to English strings while still mirroring for an RTL locale", () => {
    setLocale("he");

    expect(t("error.retry")).toBe("Retry");
    expect(getLocaleDirection()).toBe("rtl");
  });

  it("ignores an unsupported locale and stays English", () => {
    setLocale("xx");

    expect(getLocale()).toBe("en");
    expect(getLocaleDirection()).toBe("ltr");
  });

  it("notifies subscribers on every supported locale change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLocale(listener);

    setLocale("ar");
    expect(listener).toHaveBeenLastCalledWith("ar");

    unsubscribe();
    setLocale("he");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("isSupportedLocale", () => {
  it("is true for catalogued locales and RTL languages", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("ar-EG")).toBe(true);
  });

  it("is false for an unknown locale", () => {
    expect(isSupportedLocale("xx")).toBe(false);
  });
});
