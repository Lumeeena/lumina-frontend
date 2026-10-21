import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility checks.
 *
 * Runs axe-core against each route and fails on serious or critical violations.
 * This catches the mechanical failures — missing labels, contrast, landmark
 * structure — leaving human testing for the rest.
 *
 * The suite runs against a production build with the backend unreachable,
 * so it only checks the static shell and loading states.
 */

const ROUTES = [
  "/",
  "/explorer",
  "/transactions",
  "/events",
  "/graphql",
  "/registry",
  "/stats",
  "/assets",
];

for (const path of ROUTES) {
  test(`a11y: ${path} has no serious or critical violations`, async ({
    page,
  }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
      serious,
      `axe-core found ${serious.length} serious/critical violation(s):\n${serious.map((v) => `  - [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`).join("\n")}`,
    ).toHaveLength(0);
  });
}
