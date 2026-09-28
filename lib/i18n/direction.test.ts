import { describe, expect, it } from "vitest";
import { getDirection, isRtl, RTL_LANGUAGES } from "./direction";

describe("getDirection", () => {
  it("returns ltr for Latin-script locales", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("es-ES")).toBe("ltr");
    expect(getDirection("fr_CA")).toBe("ltr");
  });

  it("returns rtl for RTL languages, including regional variants and casing", () => {
    for (const locale of ["ar", "he", "fa", "ur", "AR-EG", "he-IL"]) {
      expect(getDirection(locale)).toBe("rtl");
    }
  });

  it("is case-insensitive about the language subtag", () => {
    expect(getDirection("AR")).toBe("rtl");
  });
});

describe("isRtl", () => {
  it("mirrors RTL languages and not others", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });
});

describe("RTL_LANGUAGES", () => {
  it("includes the common RTL languages", () => {
    for (const lang of ["ar", "he", "fa", "ur"]) {
      expect(RTL_LANGUAGES.has(lang)).toBe(true);
    }
  });
});
