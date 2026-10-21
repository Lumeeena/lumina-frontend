import { expect, test } from "@playwright/test";

// Blocking workers makes the fixture route authoritative even after navigation.
test.use({ serviceWorkers: "block", locale: "en-US", timezoneId: "UTC" });

const account = "GBXFWZQ4DKIWTZ4XFYQV5JFBMXQX7LZXXRZ3NOLCZC3YJT4JX5ZVXKJ";
const transactions = [true, false].map((successful, index) => ({
  hash: (index ? "b" : "a").repeat(64),
  ledger: 12345 + index,
  sourceAccount: account,
  feeCharged: "100",
  operationCount: index + 1,
  createdAt: "2026-01-01T11:59:00Z",
  successful,
  memoType: "none",
  memo: null,
}));

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"));
});

test("populated transaction view and navigation retain their accessible structure", async ({
  page,
}) => {
  await page.route(
    process.env.E2E_GRAPHQL_URL ?? "http://127.0.0.1:59999/graphql",
    async (route) => {
      await route.fulfill({
        json: {
          data: {
            transactions: {
              items: transactions,
              pageInfo: { hasNextPage: false, cursor: null },
            },
          },
        },
      });
    },
  );
  await page.goto("/transactions");
  await expect(page.getByTestId("result-count")).toHaveText("2 loaded");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("main")).toMatchAriaSnapshot({
    name: "transactions.aria.yml",
  });
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toMatchAriaSnapshot({ name: "navigation.aria.yml" });
});

test("backend failure exposes a named retry action", async ({ page }) => {
  await page.route(
    process.env.E2E_GRAPHQL_URL ?? "http://127.0.0.1:59999/graphql",
    (route) => route.abort(),
  );
  await page.goto("/transactions");
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toMatchAriaSnapshot({
    name: "transactions-unavailable.aria.yml",
  });
});

test("watch list empty state exposes its form and notification controls", async ({
  page,
}) => {
  await page.goto("/watch");
  await expect(
    page.getByRole("heading", { name: "Background notifications" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toMatchAriaSnapshot({
    name: "watch-empty.aria.yml",
  });
});
