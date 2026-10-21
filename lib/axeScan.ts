import axe from "axe-core";

/**
 * Run axe-core over a rendered component and return its WCAG A/AA violations,
 * as readable strings, so a failing test names the rule and the node count.
 *
 * Colour contrast is switched off here. jsdom does not resolve the CSS custom
 * properties the components colour themselves with, so axe would check the
 * wrong values. Contrast is checked against the token values in
 * lib/contrast.test.ts instead.
 */
export async function wcagViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`,
  );
}
