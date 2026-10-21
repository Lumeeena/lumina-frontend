import { expect, test } from "@playwright/test";
import { STABLE_ROUTES } from "../lib/routes";
import { isHydrationDiagnostic } from "../test-support/hydration";

// A different browser time zone and language catch host-default formatting.
test.use({ timezoneId: "Pacific/Honolulu", locale: "de-DE" });

for (const { path } of STABLE_ROUTES) {
  test(`${path} hydrates without mismatches`, async ({ page }) => {
    const diagnostics: string[] = [];
    page.on("console", (message) => {
      if (isHydrationDiagnostic(message.text()))
        diagnostics.push(message.text());
    });
    page.on("pageerror", (error) => {
      if (isHydrationDiagnostic(error.message)) diagnostics.push(error.message);
    });
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Prove hydration completed by exercising a real shared client control.
    const theme = page.getByRole("button", {
      name: /Current:.*Click to switch/i,
    });
    const before = await theme.getAttribute("aria-label");
    await theme.click();
    await expect(theme).not.toHaveAttribute("aria-label", before!);
    expect(diagnostics).toEqual([]);
  });
}
