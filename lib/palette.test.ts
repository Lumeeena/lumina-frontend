import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colorTokens } from "@/lib/generated/palette";
import { parseLightPalette } from "@/scripts/gen-palette.mjs";

/**
 * `app/globals.css` is the only place a hex value may be authored. The
 * generated mirror exists for consumers that cannot read CSS custom
 * properties (the web-app manifest, the Satori share cards), so this keeps
 * the two definitions of the palette from ever disagreeing.
 */
describe("generated palette", () => {
  it("matches the light palette declared in app/globals.css", () => {
    const stylesheet = readFileSync("app/globals.css", "utf8");
    expect(colorTokens).toEqual(parseLightPalette(stylesheet));
  });
});
