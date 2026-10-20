import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";

const LONG_QUERY = "x".repeat(180);
const GRAPHQL_FIXTURE_PORT = 59999;
const RESULT_HASH = "a".repeat(64);
const RESULT_SOURCE =
  "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY";

async function startGraphqlFixture() {
  const graphqlFixture = createServer((request, response) => {
    if (request.method !== "POST" || request.url !== "/graphql") {
      response.destroy();
      return;
    }

    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const payload = JSON.parse(body) as { variables?: { query?: string } };
      if (payload.variables?.query !== LONG_QUERY) {
        response.destroy();
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          data: {
            search: {
              items: [
                {
                  hash: RESULT_HASH,
                  ledger: 500,
                  createdAt: "2025-01-01T00:00:00.000Z",
                  sourceAccount: RESULT_SOURCE,
                  feeCharged: "1000000",
                  operationCount: 1,
                  successful: true,
                  memoType: "text",
                  memo: LONG_QUERY,
                },
              ],
            },
          },
        }),
      );
    });
  });

  try {
    await new Promise<void>((resolve, reject) => {
      graphqlFixture
        .once("error", reject)
        .listen(GRAPHQL_FIXTURE_PORT, resolve);
    });
  } catch (error) {
    await stopGraphqlFixture(graphqlFixture);
    throw error;
  }

  return graphqlFixture;
}

async function stopGraphqlFixture(graphqlFixture: Server) {
  await new Promise<void>((resolve) => graphqlFixture.close(() => resolve()));
}

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    dimensions.scrollWidth,
    "the document must not scroll horizontally",
  ).toBeLessThanOrEqual(dimensions.clientWidth);
}

test.describe("search reflow at a narrow CSS viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the no-query page within the viewport and its links reachable", async ({
    page,
  }) => {
    await page.goto("/search");

    await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
    await expectNoPageOverflow(page);

    // The navbar is intentionally independently scrollable on narrow screens;
    // focusing a route link proves it remains in the keyboard reachability tree.
    const explorer = page.getByRole("link", { name: "Explorer", exact: true });
    await explorer.focus();
    await expect(explorer).toBeFocused();
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("keeps a long-query result page from widening the document", async ({
    page,
  }) => {
    let graphqlFixture = process.env.E2E_GRAPHQL_URL
      ? undefined
      : await startGraphqlFixture();

    try {
      await page.goto(`/search?q=${encodeURIComponent(LONG_QUERY)}`);

      await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
      await expect(page.getByTitle(RESULT_HASH)).toBeVisible();

      // The result is server-rendered, so the fixture can stop before the
      // remaining client-side layout and keyboard assertions run. This also
      // minimizes the time the shared dead-backend port is occupied.
      if (graphqlFixture) {
        const fixture = graphqlFixture;
        graphqlFixture = undefined;
        await stopGraphqlFixture(fixture);
      }

      await expectNoPageOverflow(page);

      const results = page.getByRole("region", { name: "Search results" });
      await results.focus();
      await expect(results).toBeFocused();

      const dimensions = await results.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
      expect(dimensions.scrollLeft).toBe(0);

      await results.press("ArrowRight");
      await expect
        .poll(() => results.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
      await expectNoPageOverflow(page);
    } finally {
      if (graphqlFixture) await stopGraphqlFixture(graphqlFixture);
    }
  });
});
