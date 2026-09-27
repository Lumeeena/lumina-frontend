import { expect, test } from "@playwright/test";

const GRAPHQL_URL = process.env.E2E_GRAPHQL_URL ?? "http://127.0.0.1:4000/graphql";
const SEEDED_ACCOUNT = "GBXFWZQ4DKIWTZ4XFYQV5JFBMXQX7LZXXRZ3NOLCZC3YJT4JX5ZVXKJ";

test.describe("seeded GraphQL backend", () => {
  test("serves seeded data and the explorer renders it", async ({ page, request }) => {
    const response = await request.post(GRAPHQL_URL, {
      data: {
        query: `query LiveSeed { latestLedger { sequence transactionCount } account(address: "${SEEDED_ACCOUNT}") { address sequence } }`,
      },
    });
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.errors).toBeUndefined();
    expect(payload.data.latestLedger.sequence).toBe(5);
    expect(payload.data.account.address).toBe(SEEDED_ACCOUNT);

    await page.goto("/stats");
    await expect(page.getByRole("heading", { name: "Network Stats" })).toBeVisible();
    await expect(page.getByText("5", { exact: true })).toBeVisible();
    await expect(page.getByText(/backend unavailable/i)).toHaveCount(0);
  });

  test("renders a seeded account through the real data path", async ({ page }) => {
    await page.goto(`/accounts/${SEEDED_ACCOUNT}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(SEEDED_ACCOUNT)).toBeVisible();
    await expect(page.getByText(/account not found/i)).toHaveCount(0);
  });
});
