import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * WCAG AA contrast audit (issue #20).
 *
 * The palette was chosen visually and two greys — `#a6a3b0` and `#c3c1cb` —
 * measured 2.47:1 and 1.78:1 on white, far below the 4.5:1 AA minimum for
 * normal text. This test re-computes every in-use foreground/background pair
 * from `app/globals.css` and fails if any text pair drops below 4.5:1, so a
 * future "lighten for aesthetics" edit cannot silently reintroduce the bug.
 *
 * Measured ratios are documented in `docs/DESIGN_SYSTEM.md` ("Contrast").
 */

function srgbToLinear(channel: number): number {
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) throw new Error(`expected #rrggbb, got ${hex}`);
  const n = parseInt(m[1], 16);
  const r = srgbToLinear(((n >> 16) & 0xff) / 255);
  const g = srgbToLinear(((n >> 8) & 0xff) / 255);
  const b = srgbToLinear((n & 0xff) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Every `--color-*` declaration inside a CSS block. */
function parseBlock(block: string): Record<string, string> {
  const palette: Record<string, string> = {};
  const declaration = /(--color-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = declaration.exec(block)) !== null) {
    const value = match[2].trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) palette[match[1]] = value;
  }
  return palette;
}

function loadPalettes(): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const css = readFileSync("app/globals.css", "utf8");
  const lightMatch = css.match(/:root\s*\{([^}]*)\}/);
  if (!lightMatch) throw new Error("app/globals.css has no :root block");
  const darkMatch = css.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/);
  if (!darkMatch)
    throw new Error('app/globals.css has no :root[data-theme="dark"] block');
  return { light: parseBlock(lightMatch[1]), dark: parseBlock(darkMatch[1]) };
}

describe("WCAG AA text contrast (issue #20)", () => {
  const { light, dark } = loadPalettes();

  it("no longer uses the known-failing greys", () => {
    expect(light["--color-text-muted"]).not.toBe("#a6a3b0");
    expect(light["--color-text-faint"]).not.toBe("#c3c1cb");
  });

  it("light text meets 4.5:1 on its in-use surfaces", () => {
    const onBase: Array<[string, string]> = [
      ["--color-text-primary", "--color-bg-base"],
      ["--color-text-secondary", "--color-bg-base"],
      ["--color-text-muted", "--color-bg-base"],
      ["--color-text-faint", "--color-bg-base"],
      ["--color-accent-text", "--color-bg-base"],
      ["--color-accent-text-hover", "--color-bg-base"],
      ["--color-success-text", "--color-bg-base"],
      ["--color-error-text", "--color-bg-base"],
      ["--color-warning-text", "--color-bg-base"],
      ["--color-neutral-text", "--color-bg-base"],
      ["--color-active-text", "--color-bg-base"],
      ["--color-error-surface-text", "--color-bg-base"],
    ];
    for (const [fg, bg] of onBase) {
      const ratio = contrastRatio(light[fg], light[bg]);
      expect(
        ratio,
        `${fg} ${light[fg]} on ${bg} ${light[bg]} = ${ratio.toFixed(2)} (need ≥ 4.5)`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    // Table headers, captions and empty states sit on bg-subtle.
    for (const fg of ["--color-text-muted", "--color-text-faint"]) {
      const ratio = contrastRatio(light[fg], light["--color-bg-subtle"]);
      expect(
        ratio,
        `${fg} on bg-subtle = ${ratio.toFixed(2)} (need ≥ 4.5)`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    // Muted/faint timestamps also appear on raised/overlay wells.
    for (const fg of ["--color-text-muted", "--color-text-faint"]) {
      for (const bg of ["--color-bg-raised", "--color-bg-overlay"]) {
        const ratio = contrastRatio(light[fg], light[bg]);
        expect(
          ratio,
          `${fg} on ${bg} = ${ratio.toFixed(2)} (need ≥ 4.5)`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("light status pills and buttons meet 4.5:1", () => {
    const pairs: Array<[string, string]> = [
      ["--color-success-text", "--color-success-bg"],
      ["--color-error-text", "--color-error-bg"],
      ["--color-warning-text", "--color-warning-bg"],
      ["--color-neutral-text", "--color-neutral-bg"],
      ["--color-active-text", "--color-active-bg"],
      ["--color-accent-text", "--color-accent-surface"],
      ["--color-error-surface-text", "--color-error-surface"],
    ];
    for (const [fg, bg] of pairs) {
      const ratio = contrastRatio(light[fg], light[bg]);
      expect(
        ratio,
        `${fg} ${light[fg]} on ${bg} ${light[bg]} = ${ratio.toFixed(2)} (need ≥ 4.5)`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    // White button/banner text on brand and inverse fills.
    for (const bg of [
      "--color-accent-fill",
      "--color-accent-fill-hover",
      "--color-inverse-bg",
    ]) {
      const ratio = contrastRatio(
        light["--color-text-inverse"],
        light[bg],
      );
      expect(
        ratio,
        `text-inverse on ${bg} = ${ratio.toFixed(2)} (need ≥ 4.5)`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("dark text meets 4.5:1 on its in-use surfaces", () => {
    const surfaces = [
      "--color-bg-base",
      "--color-bg-subtle",
      "--color-bg-raised",
      "--color-bg-overlay",
    ];
    for (const fg of [
      "--color-text-primary",
      "--color-text-secondary",
      "--color-text-muted",
      "--color-text-faint",
    ]) {
      for (const bg of surfaces) {
        const ratio = contrastRatio(dark[fg], dark[bg]);
        expect(
          ratio,
          `dark ${fg} ${dark[fg]} on ${bg} ${dark[bg]} = ${ratio.toFixed(2)} (need ≥ 4.5)`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }

    const statusPairs: Array<[string, string]> = [
      ["--color-success-text", "--color-success-bg"],
      ["--color-error-text", "--color-error-bg"],
      ["--color-warning-text", "--color-warning-bg"],
      ["--color-neutral-text", "--color-neutral-bg"],
      ["--color-active-text", "--color-active-bg"],
      ["--color-accent-text", "--color-accent-surface"],
      ["--color-error-surface-text", "--color-error-surface"],
    ];
    for (const [fg, bg] of statusPairs) {
      const ratio = contrastRatio(dark[fg], dark[bg]);
      expect(
        ratio,
        `dark ${fg} on ${bg} = ${ratio.toFixed(2)} (need ≥ 4.5)`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
