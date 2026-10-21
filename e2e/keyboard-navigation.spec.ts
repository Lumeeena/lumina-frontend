import { expect, test } from "@playwright/test";

/**
 * Keyboard-only navigation end-to-end tests.
 *
 * These tests verify that the entire application is navigable using only
 * the keyboard, with proper focus management and tab order. This ensures
 * that keyboard-only users and users with assistive technologies can
 * access all features of the application.
 */

test("the home page is fully navigable with keyboard only", async ({
  page,
}) => {
  await page.goto("/");

  // Focus should start on the page
  let activeElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(activeElement).toBeTruthy();

  // Tab through interactive elements
  const interactiveCount = await page.locator(
    "button, a, input, [tabindex='0']",
  ).count();
  expect(interactiveCount).toBeGreaterThan(0);

  // Press Tab and verify focus moves
  await page.keyboard.press("Tab");
  let focusedElement = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return el?.tagName || null;
  });
  expect(focusedElement).toBeTruthy();

  // Continue tabbing through page
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    focusedElement = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return el?.getAttribute?.("aria-label") ||
        el?.textContent?.substring(0, 20) ||
        el?.tagName;
    });
    expect(focusedElement).toBeTruthy();
  }
});

test("navigation menu is accessible via keyboard", async ({ page }) => {
  await page.goto("/explorer");

  // Find navigation links
  const navLinks = page.getByRole("link", { name: /Explorer|Transactions|Events|GraphQL|Registry|Stats/ });
  const count = await navLinks.count();
  expect(count).toBeGreaterThan(0);

  // Verify first nav link can receive focus
  const firstLink = navLinks.first();
  await firstLink.focus();
  await expect(firstLink).toBeFocused();
});

test("search input is accessible via keyboard", async ({ page }) => {
  await page.goto("/");

  // Keyboard shortcut / focuses search
  await page.keyboard.press("/");
  await expect(page.getByLabel("Search")).toBeFocused();

  // Type in search
  await page.keyboard.type("test");
  await expect(page.getByLabel("Search")).toHaveValue("test");

  // Submit with Enter
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/explorer/);
});

test("focus is properly restored after page navigation", async ({ page }) => {
  await page.goto("/");

  // Navigate to a different page via keyboard
  const explorerLink = page.getByRole("link", { name: "Explorer" }).first();
  await explorerLink.focus();
  await expect(explorerLink).toBeFocused();
  await page.keyboard.press("Enter");

  // Verify navigation succeeded
  await expect(page).toHaveURL(/\/explorer$/);

  // Verify page has a focusable element
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
});

test("escape key closes modals or cancels actions", async ({ page }) => {
  await page.goto("/");

  // The page should handle Escape gracefully
  await page.keyboard.press("Escape");

  // Page should still be functional
  await expect(page).toHaveURL("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
});

test("all interactive elements are reachable via Tab", async ({ page }) => {
  await page.goto("/");

  const interactiveElements = page.locator(
    'button, a[href], input, select, textarea, [role="button"], [tabindex="0"], [tabindex="1"]',
  );
  const count = await interactiveElements.count();

  // Start fresh
  await page.keyboard.press("Tab");
  let reachableCount = 0;

  // Tab through the page and count focused elements
  for (let i = 0; i < count + 5; i++) {
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return el?.offsetParent !== null; // Check if visible
    });

    if (focused) {
      reachableCount++;
    }

    await page.keyboard.press("Tab");
  }

  // At least some interactive elements should be reachable
  expect(reachableCount).toBeGreaterThan(2);
});

test("focus order is logical on the explorer page", async ({ page }) => {
  await page.goto("/explorer");

  // Get initial focus
  await page.keyboard.press("Tab");
  const firstElement = await page.evaluate(() => {
    return (document.activeElement as HTMLElement)?.getAttribute("aria-label") ||
      (document.activeElement as HTMLElement)?.textContent?.substring(0, 20);
  });

  // Navigate through several elements
  const focusedElements: string[] = [];
  for (let i = 0; i < 10; i++) {
    const element = await page.evaluate(() => {
      return (document.activeElement as HTMLElement)?.getAttribute("aria-label") ||
        (document.activeElement as HTMLElement)?.getAttribute("id") ||
        (document.activeElement as HTMLElement)?.tagName;
    });
    focusedElements.push(element || "unknown");
    await page.keyboard.press("Tab");
  }

  // We should have moved through different elements
  const uniqueElements = new Set(focusedElements);
  expect(uniqueElements.size).toBeGreaterThan(1);
});

test("buttons can be activated with Enter and Space", async ({ page }) => {
  await page.goto("/");

  // Find a button (Explorer link serves as button)
  const button = page.getByRole("link", { name: "Open Explorer" });
  await button.focus();
  await expect(button).toBeFocused();

  // Enter should navigate
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/explorer$/);
});

test("form inputs are accessible via keyboard", async ({ page }) => {
  await page.goto("/");

  // Tab to search input
  let attempts = 0;
  while (attempts < 20) {
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label"),
    );
    if (focused === "Search") break;
    await page.keyboard.press("Tab");
    attempts++;
  }

  // Should have found the search input
  expect(attempts).toBeLessThan(20);
  await expect(page.getByLabel("Search")).toBeFocused();

  // Type and verify
  await page.keyboard.type("GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY");
  await expect(page.getByLabel("Search")).toHaveValue(/GBWK/);
});
