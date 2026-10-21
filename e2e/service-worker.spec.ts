import { expect, test } from "@playwright/test";

test("the installed worker serves fresh offline data and rejects an expired entry", async ({
  page,
  context,
}) => {
  await page.goto("/watch");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const online = await page.evaluate(async () =>
    (await fetch("/robots.txt", { cache: "reload" })).text(),
  );
  expect(online).toContain("User-Agent:");

  await context.setOffline(true);
  expect(
    await page.evaluate(async () =>
      (await fetch("/robots.txt", { cache: "reload" })).text(),
    ),
  ).toBe(online);

  await page.evaluate(async () => {
    const cacheName = (await caches.keys()).find(
      (name) => name.startsWith("lumina-") && name.endsWith("-data"),
    );
    if (!cacheName) throw new Error("The worker did not create its data cache");
    const cache = await caches.open(cacheName);
    const response = await cache.match("/robots.txt");
    if (!response)
      throw new Error("The worker did not cache the online response");
    const headers = new Headers(response.headers);
    headers.set("X-Lumina-Cached-At", String(Date.now() - 5 * 60 * 1000));
    await cache.put(
      "/robots.txt",
      new Response(await response.blob(), { headers }),
    );
  });
  expect(
    await page.evaluate(async () => {
      try {
        await fetch("/robots.txt", { cache: "reload" });
        return "served stale data";
      } catch {
        return "expired";
      }
    }),
  ).toBe("expired");
  await context.setOffline(false);
});
