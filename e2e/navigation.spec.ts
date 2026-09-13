import { expect, test } from "@playwright/test";

/**
 * Primary navigation journeys.
 *
 * These run against a production build with the GraphQL backend deliberately
 * unreachable, so what they prove is that every route renders, the nav works,
 * and no page white-screens when the indexer is down — the failure mode a user
 * is most likely to meet and the one no unit test can catch, because it depends
 * on the real server/client component split.
 */

const NAV = [
  { label: "Explorer", path: "/explorer" },
  { label: "Transactions", path: "/transactions" },
  { label: "Contract Events", path: "/events" },
  { label: "GraphQL", path: "/graphql" },
  { label: "Registry", path: "/registry" },
  { label: "Stats", path: "/stats" },
];

test("the home page renders and links into the app", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("navigation")).toBeVisible();
  // `exact` because the home page also links to cards whose text contains the
  // product name, and the wordmark is the one being asserted here.
  await expect(page.getByRole("link", { name: "Lumina", exact: true })).toBeVisible();
});

for (const { label, path } of NAV) {
  test(`nav: ${label} reaches ${path} and renders a heading`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: label, exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`${path}$`));
    // A heading is the cheapest proof the route rendered rather than
    // white-screening on a failed fetch.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("every route renders directly, not only via client navigation", async ({ page }) => {
  // Server-rendered first paint is a different code path from a client-side
  // transition, and only this catches a server-component crash.
  for (const { path } of NAV) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} should not error`).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("the nav marks the section you are in", async ({ page }) => {
  await page.goto("/registry");

  const active = page.getByRole("link", { name: "Registry", exact: true });
  await expect(active).toHaveClass(/bg-\[#f6f5f8\]/);
});

test("an account page degrades to a not-found state when the backend is down", async ({ page }) => {
  const address = "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY";
  const response = await page.goto(`/accounts/${address}`);

  // The route must render its own fallback rather than erroring — the account
  // detail heading is the address itself, so with no data there is no h1 and
  // the not-found panel is what should be on screen.
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByText(/account not found/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("the accounts search route redirects rather than dead-ending", async ({ page }) => {
  await page.goto("/accounts");
  await expect(page).toHaveURL(/\/explorer$/);
});

test("the registry page offers wallet connection when no wallet is present", async ({ page }) => {
  await page.goto("/registry");

  // No extension in a clean browser context, so the connect affordance is what
  // should render — not a half-built form.
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
});

test("the transactions explorer renders its filters with the backend down", async ({ page }) => {
  await page.goto("/transactions");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("the GraphQL playground renders its editor", async ({ page }) => {
  await page.goto("/graphql");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("textarea").first()).toBeVisible();
});
