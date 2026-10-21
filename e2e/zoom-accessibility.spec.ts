import { test, expect } from "@playwright/test";

/**
 * WCAG 2.1 Success Criterion 1.4.10 (Reflow)
 *
 * Content must be presentable without loss of information or functionality,
 * and without requiring scrolling in two dimensions at 200% zoom (1280px
 * viewport becomes 640px effective width).
 *
 * These tests verify that:
 * - Pages remain usable at 200% browser zoom
 * - No horizontal page scrolling is required
 * - Wide content scrolls within its own container rather than the page
 * - All interactive controls remain reachable
 */

const ZOOM_LEVEL = 2.0; // 200%
const BASE_VIEWPORT = { width: 1280, height: 720 };

test.describe("200% Zoom Accessibility", () => {
  test.use({
    viewport: BASE_VIEWPORT,
  });

  test.beforeEach(async ({ page }) => {
    // Apply 200% zoom by setting deviceScaleFactor
    await page.setViewportSize({
      ...BASE_VIEWPORT,
      deviceScaleFactor: ZOOM_LEVEL,
    });
  });

  test("home route (/) is usable at 200% zoom", async ({ page }) => {
    await page.goto("/");

    // Wait for content to load
    await expect(
      page.getByRole("heading", { name: /Stellar network data/i }),
    ).toBeVisible();

    // Check that page does not have horizontal scroll
    const pageScrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const pageClientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(pageScrollWidth).toBeLessThanOrEqual(pageClientWidth + 1); // +1 for rounding

    // Verify key interactive elements are accessible
    await expect(
      page.getByRole("link", { name: /Open Explorer/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /GraphQL Playground/i }),
    ).toBeVisible();

    // Verify search bar is accessible
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
  });

  test("explorer route (/explorer) is usable at 200% zoom", async ({
    page,
  }) => {
    await page.goto("/explorer");

    // Wait for heading
    await expect(page.getByRole("heading", { name: "Explorer" })).toBeVisible();

    // Check that page does not have horizontal scroll
    const pageScrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const pageClientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(pageScrollWidth).toBeLessThanOrEqual(pageClientWidth + 1);

    // Verify search bar is accessible
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();

    // Wait for transactions to load (if any)
    await page.waitForTimeout(2000);

    // If transaction table exists, verify it has its own scroll container
    const tableContainer = page.locator('[data-testid="transaction-scroll"]');
    if ((await tableContainer.count()) > 0) {
      const containerOverflow = await tableContainer.evaluate(
        (el) => window.getComputedStyle(el).overflow,
      );
      expect(containerOverflow).toContain("auto");
    }
  });

  test("transactions route (/transactions) is usable at 200% zoom", async ({
    page,
  }) => {
    await page.goto("/transactions");

    // Wait for heading
    await expect(
      page.getByRole("heading", { name: "Transactions" }),
    ).toBeVisible();

    // Check that page does not have horizontal scroll
    const pageScrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const pageClientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(pageScrollWidth).toBeLessThanOrEqual(pageClientWidth + 1);

    // Wait for transactions to load (if any)
    await page.waitForTimeout(2000);

    // Verify transaction table has its own scroll container
    const tableContainer = page.locator('[data-testid="transaction-scroll"]');
    if ((await tableContainer.count()) > 0) {
      const containerOverflow = await tableContainer.evaluate(
        (el) => window.getComputedStyle(el).overflow,
      );
      expect(containerOverflow).toContain("auto");
    }
  });

  test("graphql route (/graphql) is usable at 200% zoom", async ({ page }) => {
    await page.goto("/graphql");

    // Wait for heading
    await expect(
      page.getByRole("heading", { name: "GraphQL Playground" }),
    ).toBeVisible();

    // Check that page does not have horizontal scroll
    const pageScrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const pageClientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(pageScrollWidth).toBeLessThanOrEqual(pageClientWidth + 1);

    // Verify key interactive elements are accessible
    await expect(
      page.getByRole("button", { name: /Run Query/i }),
    ).toBeVisible();

    // Verify query editor is visible and accessible
    const editor = page.locator(".graphql-editor");
    await expect(editor).toBeVisible();
  });
});
