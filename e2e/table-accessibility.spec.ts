import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const transaction = {
  hash: "a".repeat(64),
  ledger: 12345,
  createdAt: "2026-01-01T00:00:00.000Z",
  sourceAccount: "G" + "B".repeat(55),
  feeCharged: "100",
  operationCount: 1,
  successful: true,
  memoType: null,
  memo: null,
};

test("the rendered transaction table is keyboard-accessible and axe-clean", async ({
  page,
}) => {
  await page.route("**/graphql", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          transactions: {
            items: [transaction],
            pageInfo: { hasNextPage: false, cursor: null },
          },
        },
      }),
    });
  });

  await page.goto("/transactions");
  const region = page.getByRole("region", { name: "Transactions" });
  const table = page.getByRole("table", { name: "Transactions" });
  await expect(table).toBeVisible();
  await expect(table.locator("caption")).toHaveText("Transactions");
  await expect(table.getByRole("columnheader")).toHaveCount(7);

  // Force overflow in the real rendered component so this browser test checks
  // scrolling mechanics rather than relying on a particular viewport width.
  await table.evaluate((element) => {
    element.style.minWidth = "1200px";
  });
  await region.focus();
  await expect(region).toBeFocused();
  await page.keyboard.press("ArrowRight");
  expect(
    await region.evaluate((element) => element.scrollLeft),
  ).toBeGreaterThan(0);

  const focusStyle = await region.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });
  expect(focusStyle).toEqual({ outlineStyle: "solid", outlineWidth: "2px" });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
