import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/explorer", "/transactions", "/events", "/graphql", "/registry", "/stats"];

// Browser tooling messages are not application failures. Keep this list
// narrow and documented so adding an exception requires an explicit reason.
const ALLOWED_MESSAGES = [
  /Download the React DevTools for a better development experience/i,
];

function isAllowed(message: string) {
  return ALLOWED_MESSAGES.some((pattern) => pattern.test(message));
}

for (const route of ROUTES) {
  test(`route ${route} has no console errors or warnings`, async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if ((message.type() === "error" || message.type() === "warning") && !isAllowed(message.text())) {
        violations.push(`console.${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => violations.push(`pageerror: ${error.message}`));

    const response = await page.goto(route);
    expect(response?.status(), `${route} should render`).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(violations, `${route} emitted browser diagnostics`).toEqual([]);
  });
}
