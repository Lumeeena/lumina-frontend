import { expect, test } from "@playwright/test";
import { existsSync } from "fs";

/**
 * Visual regression: one full-page screenshot per stable route.
 *
 * Skipped until baselines exist. Screenshots are only comparable against
 * baselines made on the same OS and fonts, so they are generated on the CI
 * platform and committed deliberately — see "Visual regression" in TESTING.md.
 * Once the baseline directory is committed this suite fails on any layout
 * change, with no further wiring.
 */

const ROUTES = [
  { name: "home", path: "/" },
  { name: "explorer", path: "/explorer" },
  { name: "transactions", path: "/transactions" },
  { name: "events", path: "/events" },
  { name: "graphql", path: "/graphql" },
  { name: "registry", path: "/registry" },
  { name: "stats", path: "/stats" },
];

for (const { name, path } of ROUTES) {
  test(`visual: ${name}`, async ({ page }, testInfo) => {
    test.skip(
      !existsSync(testInfo.snapshotDir) && testInfo.config.updateSnapshots !== "all",
      "no baselines committed yet",
    );

    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: "disabled",
      // Both change without the layout changing: the connection state moves
      // through retry backoff, and the footer carries the package version.
      mask: [page.getByTestId("connection-indicator"), page.getByTestId("app-version")],
    });
  });
}
