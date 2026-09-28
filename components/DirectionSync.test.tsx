// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import DirectionSync from "./DirectionSync";
import { setLocale } from "@/lib/i18n";

afterEach(() => {
  setLocale("en");
  document.documentElement.lang = "";
  document.documentElement.removeAttribute("dir");
});

describe("DirectionSync (#31)", () => {
  it("sets the document to ltr with the active locale language on mount", () => {
    render(<DirectionSync />);

    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });

  it("mirrors the document to rtl when an RTL locale is activated", () => {
    render(<DirectionSync />);

    act(() => setLocale("ar"));

    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
  });

  it("returns to ltr when the locale switches back", () => {
    render(<DirectionSync />);
    act(() => setLocale("ur"));

    act(() => setLocale("en"));

    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });
});
