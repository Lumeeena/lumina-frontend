import { expect, test } from "@playwright/test";

/**
 * The network is part of the URL.
 *
 * These run against a production build with the GraphQL backend deliberately
 * unreachable, the same as `navigation.spec.ts`: what they prove is the URL
 * contract, which is exactly the part a unit test cannot prove — that a link
 * someone shares carries the network, that clicking around keeps it, and that
 * the server-rendered first paint agrees with the address bar.
 */

test("choosing a network puts it in the URL", async ({ page }) => {
  await page.goto("/explorer");

  // A URL that says nothing about a network is the default one, and stays clean.
  await expect(page.getByLabel("Stellar network")).toHaveValue("mainnet");
  await expect(page).toHaveURL(/\/explorer$/);

  await page.getByLabel("Stellar network").selectOption("testnet");

  await expect(page).toHaveURL(/\/explorer\?network=testnet$/);
  await expect(page.getByLabel("Stellar network")).toHaveValue("testnet");
});

test("the selected network survives navigating the app", async ({ page }) => {
  await page.goto("/explorer?network=testnet");

  await page.getByRole("link", { name: "Stats", exact: true }).click();

  await expect(page).toHaveURL(/\/stats\?network=testnet$/);
  await expect(page.getByLabel("Stellar network")).toHaveValue("testnet");

  // …and going back to the default network takes the parameter back out.
  await page.getByLabel("Stellar network").selectOption("mainnet");

  await expect(page).toHaveURL(/\/stats$/);
});

test("a shared link opens on the network it names", async ({ page }) => {
  await page.goto("/transactions?network=futurenet");

  await expect(page.getByLabel("Stellar network")).toHaveValue("futurenet");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a network we do not know falls back to the default, and the URL is corrected", async ({
  page,
}) => {
  await page.goto("/explorer?network=lolnet");

  await expect(page.getByLabel("Stellar network")).toHaveValue("mainnet");
  await expect(page).toHaveURL(/\/explorer$/);
});
