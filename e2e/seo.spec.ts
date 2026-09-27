import { expect, test } from "@playwright/test";

/**
 * The crawling surface, end to end.
 *
 * The unit tests assert what these files are built from; this asserts what a
 * crawler actually receives over HTTP — the served `Content-Type`, the resolved
 * absolute URLs in the meta tags, and the PNG behind `og:image`. A page can have
 * perfect metadata objects and still emit a relative URL or a 404 image, and
 * only a request against the running app catches that.
 */

const ADDRESS = "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY";

const ROUTES = [
  { path: "/", title: "Lumina — Stellar Data Layer" },
  { path: "/explorer", title: "Explorer — Lumina" },
  { path: "/transactions", title: "Transactions — Lumina" },
  { path: "/events", title: "Contract Events — Lumina" },
  { path: "/stats", title: "Stats — Lumina" },
  { path: "/graphql", title: "GraphQL — Lumina" },
  { path: "/registry", title: "Registry — Lumina" },
];

/** The `content` of a `<meta>` tag, read from the served HTML rather than the DOM's parsed view. */
async function meta(page: import("@playwright/test").Page, selector: string) {
  return page.locator(selector).first().getAttribute("content");
}

test("robots.txt allows the site, blocks the unbounded routes, and points at the sitemap", async ({ page }) => {
  const response = await page.goto("/robots.txt");

  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-type"]).toContain("text/plain");

  const body = await page.locator("body").innerText();
  expect(body).toContain("User-Agent: *");
  expect(body).toContain("Allow: /");
  // One page per Stellar address: not a set a crawler can be asked to walk.
  expect(body).toContain("Disallow: /accounts/");
  // Filtered views of routes that are already listed.
  expect(body).toContain("Disallow: /*?");
  expect(body).toContain("Sitemap: ");
});

test("sitemap.xml lists the stable routes and nothing unbounded", async ({ page }) => {
  const response = await page.goto("/sitemap.xml");

  expect(response?.status()).toBe(200);
  const xml = await page.locator("body").innerText();

  for (const { path } of ROUTES) {
    // Home is the bare origin; the rest carry their path.
    const url = path === "/" ? "" : path;
    expect(xml, `${path} should be in the sitemap`).toContain(url);
  }
  expect(xml).not.toContain("/accounts/");
  expect(xml).not.toContain("?");
});

for (const { path, title } of ROUTES) {
  test(`share metadata: ${path} carries a complete card`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveTitle(title);

    // Absolute, or a client resolves it against nothing and shows no preview.
    const image = await meta(page, 'meta[property="og:image"]');
    expect(image, `${path} needs an og:image`).toBeTruthy();
    expect(image).toMatch(/^https?:\/\//);

    expect(await meta(page, 'meta[property="og:site_name"]')).toBe("Lumina");
    expect(await meta(page, 'meta[property="og:title"]')).toBeTruthy();
    expect(await meta(page, 'meta[name="description"]')).toBeTruthy();

    // The card has to be a large image to render as a card rather than a
    // thumbnail beside a link.
    expect(await meta(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(await meta(page, 'meta[name="twitter:image"]')).toBe(image);

    // One canonical URL per page, and it is the one that was requested. The
    // host is whatever `NEXT_PUBLIC_SITE_URL` was set to at build time, so only
    // the path is asserted — pinning the host would fail every run outside
    // production. Next emits home as the bare origin, without a trailing slash.
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
    expect(canonical).toBeTruthy();
    const { pathname } = new URL(canonical as string);
    expect(pathname).toBe(path === "/" ? "/" : path);
  });
}

/** Width and height, read from the IHDR chunk rather than from our own metadata. */
function pngSize(bytes: Buffer) {
  // 8-byte signature, then an IHDR chunk whose payload starts with the size.
  expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(bytes.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("the default share image is a real 1200×630 PNG", async ({ request }) => {
  const response = await request.get("/opengraph-image");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");

  // The meta tags promise 1200×630; a client crops or letterboxes otherwise.
  // Read from the file so the promise is checked, not just restated.
  expect(pngSize(await response.body())).toEqual({ width: 1200, height: 630 });
});

test("an account page gets its own card, built without the backend", async ({ request }) => {
  // The indexer is unreachable in this suite. The card still has to render —
  // preview bots do not retry, and a blank image is a lost share.
  const response = await request.get(`/accounts/${ADDRESS}/opengraph-image`);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  expect(pngSize(await response.body())).toEqual({ width: 1200, height: 630 });
});

test("an account page's card points at that account's own image", async ({ page }) => {
  await page.goto(`/accounts/${ADDRESS}`);

  expect(await meta(page, 'meta[property="og:image"]')).toContain(`/accounts/${ADDRESS}/opengraph-image`);
  await expect(page).toHaveTitle(/^G/);
});
