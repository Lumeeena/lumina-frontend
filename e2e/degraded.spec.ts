import { expect, test } from "@playwright/test";

/**
 * Degraded and in-flight rendering, end to end.
 *
 * The suite's backend is a port nothing listens on, so every fetch here fails
 * immediately rather than hanging. That proves the failure path — a route with
 * no data still renders its own explanation instead of a spinner that never
 * resolves — but not the *slow* path, which is the half that regresses
 * silently. A request is stalled deliberately in the tests below to cover it.
 */

/**
 * Hold GraphQL requests open, and hand back the switch that releases them.
 *
 * The suite's backend refuses connections, which exercises the failure path but
 * not the slow one. A stalled request is the harder case to get right — the app
 * has to stay interactive and honest while it waits — and the only way to see
 * it is to withhold a response that is never coming.
 */
async function stall(page: import("@playwright/test").Page, url: string) {
  let release!: () => void;
  const held = new Promise<void>(resolve => {
    release = resolve;
  });

  await page.route(url, async route => {
    await held;
    // The test may have navigated away before this resolves.
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" }).catch(() => {});
  });

  return () => {
    release();
    return page.unroute(url);
  };
}

const SERVER_ROUTES = ["/", "/events", "/stats"];
const CLIENT_ROUTES = ["/explorer", "/transactions", "/registry"];

/**
 * A note on what is *not* asserted here: the server-rendered loading skeleton.
 *
 * The suite's backend refuses the connection immediately, so a server route
 * spends a few milliseconds in its loading boundary and is gone before a
 * browser can poll for it — and `page.route` intercepts the browser's requests,
 * not the app server's own fetch, so it cannot stall one. Asserting on a frame
 * that brief would be a flaky test pretending to be coverage. The skeleton's
 * appearance, labelling and replacement are asserted against real deferred
 * promises in `app/slowApi.test.tsx`, which can control the timing; what is
 * left to check end to end is that every route comes to rest in a state of its
 * own instead of a loading state it never leaves.
 */
test("no route is left showing a loading skeleton it never leaves", async ({ page }) => {
  for (const path of [...SERVER_ROUTES, ...CLIENT_ROUTES]) {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 }), `${path} should render`).toBeVisible({
      timeout: 15_000,
    });
    // Matched by name, not by role: the home page's live-feed indicator is
    // also a `role="status"` and legitimately sits in RECONNECTING against an
    // unreachable socket. A stuck skeleton is the failure this guards — the
    // route never resolving its own state — so it is named, not role-matched.
    await expect(page.getByRole("status", { name: /^Loading / })).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Application error");
  }
});

test("a route with no data explains itself instead of spinning forever", async ({ page }) => {
  for (const path of [...SERVER_ROUTES, ...CLIENT_ROUTES]) {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 }), `${path} should render`).toBeVisible({
      timeout: 15_000,
    });
    // The white screen and the infinite spinner are the two failures worth
    // catching; a specific message is the page's business, not this test's.
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.getByText("Loading")).toHaveCount(0);
  }
});

test("an unreachable backend does not leave the app mid-hydration", async ({ page }) => {
  await page.goto("/registry");

  // A client-side fetch that rejects during hydration can leave a page that
  // looks painted but is not interactive.
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeEnabled();
});

test("client routes stay usable while their data is still in flight", async ({ page }) => {
  for (const path of CLIENT_ROUTES) {
    const release = await stall(page, "**/graphql");
    await page.goto(path);

    // These fetch after hydration, so no server-rendered skeleton appears. What
    // has to hold is that the route is still navigable and interactive while
    // the request is outstanding — a blank page or a dead control is the bug.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    // Releasing must not corrupt the page that was already interactive.
    await release();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
