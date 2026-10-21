import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);
const ORIGIN = "https://lumina.test";
const MAX_AGE = 5 * 60 * 1000;

// Execute the shipped worker, rather than a second implementation of its policy.
// The harness implements only event lifetimes and CacheStorage, using real
// Response/Headers cloning and body consumption to catch response reuse bugs.
function worker(code = source, stores = new Map()) {
  const handlers = new Map();
  let now = 1_800_000_000_000;
  const fetch = vi.fn(async () => new Response("fresh"));
  const key = (request) =>
    new URL(typeof request === "string" ? request : request.url, ORIGIN).href;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        match: async (request) => entries.get(key(request))?.clone(),
        put: async (request, response) => {
          entries.set(key(request), response.clone());
        },
        delete: async (request) => entries.delete(key(request)),
        addAll: async (requests) => {
          for (const request of requests)
            entries.set(key(request), await fetch(request));
        },
      };
    },
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (name, handler) => handlers.set(name, handler),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn(async () => {}) },
  };
  vm.runInNewContext(code, {
    self,
    caches,
    fetch,
    Response,
    Headers,
    URL,
    Date: { now: () => now },
  });
  return {
    stores,
    caches,
    fetch,
    self,
    advance: (ms) => {
      now += ms;
    },
    async lifecycle(name, data) {
      const pending = [];
      handlers.get(name)({
        data,
        waitUntil: (promise) => pending.push(promise),
      });
      await Promise.all(pending);
    },
    request(url, options = {}) {
      let result;
      handlers.get("fetch")({
        request: {
          url: new URL(url, ORIGIN).href,
          method: "GET",
          mode: "cors",
          destination: "",
          ...options,
        },
        respondWith: (promise) => {
          result = promise;
        },
      });
      return result;
    },
  };
}

describe("service worker caching", () => {
  it("installs only the static shell, then takes control", async () => {
    const sw = worker();
    await sw.lifecycle("install");
    await sw.lifecycle("activate");
    expect(sw.self.skipWaiting).toHaveBeenCalledOnce();
    expect(sw.self.clients.claim).toHaveBeenCalledOnce();
    expect([...sw.stores.get("lumina-v2-shell").keys()]).toEqual([
      `${ORIGIN}/manifest.webmanifest`,
      `${ORIGIN}/icons/icon-192.svg`,
      `${ORIGIN}/icons/icon-512.svg`,
    ]);
    sw.fetch.mockRejectedValue(new Error("offline"));
    expect(await (await sw.request("/icons/icon-192.svg")).text()).toBe(
      "fresh",
    );
    expect(await (await sw.request("/manifest.webmanifest")).text()).toBe(
      "fresh",
    );
  });

  it("fetches an immutable asset on a miss and serves repeat hits from cache", async () => {
    const sw = worker();
    expect(await (await sw.request("/_next/static/chunks/app.js")).text()).toBe(
      "fresh",
    );
    expect(await (await sw.request("/_next/static/chunks/app.js")).text()).toBe(
      "fresh",
    );
    expect(sw.fetch).toHaveBeenCalledOnce();
  });

  it("does not cache asset errors", async () => {
    const sw = worker();
    sw.fetch.mockResolvedValueOnce(new Response("missing", { status: 404 }));
    expect((await sw.request("/_next/static/chunks/missing.js")).status).toBe(
      404,
    );
    await sw.request("/_next/static/chunks/missing.js");
    expect(sw.fetch).toHaveBeenCalledTimes(2);
  });

  it("refreshes data from the network and serves the latest copy offline within five minutes", async () => {
    const sw = worker();
    await sw.request("/graphql?query=stats");
    sw.fetch.mockResolvedValueOnce(new Response("updated"));
    await sw.request("/graphql?query=stats");
    sw.fetch.mockRejectedValue(new Error("offline"));
    sw.advance(MAX_AGE - 1);
    expect(await (await sw.request("/graphql?query=stats")).text()).toBe(
      "updated",
    );
  });

  it.each([MAX_AGE, MAX_AGE + 1, -1])(
    "rejects and removes data with an invalid age (%i ms)",
    async (age) => {
      const sw = worker();
      await sw.request("/stats");
      sw.advance(age);
      sw.fetch.mockRejectedValue(new Error("offline"));
      await expect(sw.request("/stats")).rejects.toThrow("offline");
      expect(
        await (await sw.caches.open("lumina-v2-data")).match("/stats"),
      ).toBeUndefined();
    },
  );

  it("never substitutes the home page for an offline data or navigation miss", async () => {
    const sw = worker();
    await sw.lifecycle("install");
    await sw.request("/");
    sw.fetch.mockRejectedValue(new Error("offline"));
    await expect(
      sw.request("/unvisited", { mode: "navigate" }),
    ).rejects.toThrow("offline");
    await expect(sw.request("/graphql?query=unseen")).rejects.toThrow(
      "offline",
    );
  });

  it.each([
    new Response("gone", { status: 404 }),
    new Response("unavailable", { status: 503 }),
    new Response("private", {
      headers: { "Cache-Control": "private, no-store" },
    }),
  ])(
    "invalidates an older success after HTTP errors or no-store responses",
    async (response) => {
      const sw = worker();
      await sw.request("/stats");
      sw.fetch.mockResolvedValueOnce(response);
      expect(await sw.request("/stats")).toBe(response);
      sw.fetch.mockRejectedValue(new Error("offline"));
      await expect(sw.request("/stats")).rejects.toThrow("offline");
    },
  );

  it("rejects undated legacy data", async () => {
    const sw = worker();
    await (
      await sw.caches.open("lumina-v2-data")
    ).put("/stats", new Response("old"));
    sw.fetch.mockRejectedValue(new Error("offline"));
    await expect(sw.request("/stats")).rejects.toThrow("offline");
  });

  it("returns the live response even when a cache write fails", async () => {
    const sw = worker();
    const open = sw.caches.open;
    sw.caches.open = async (name) => ({
      ...(await open(name)),
      put: async () => {
        throw new Error("quota exceeded");
      },
    });
    expect(await (await sw.request("/stats")).text()).toBe("fresh");
  });

  it("keeps query variants separate and refreshes the expiry window after a network hit", async () => {
    const sw = worker();
    await sw.request("/graphql?query=one");
    sw.advance(MAX_AGE - 1);
    await sw.request("/graphql?query=one");
    sw.advance(MAX_AGE - 1);
    sw.fetch.mockRejectedValue(new Error("offline"));
    expect(await (await sw.request("/graphql?query=one")).text()).toBe("fresh");
    await expect(sw.request("/graphql?query=two")).rejects.toThrow("offline");
  });

  it("leaves POSTs and extension requests to the browser", () => {
    const sw = worker();
    expect(sw.request("/graphql", { method: "POST" })).toBeUndefined();
    expect(
      sw.request("chrome-extension://extension/script.js"),
    ).toBeUndefined();
    expect(sw.fetch).not.toHaveBeenCalled();
  });

  it("a new deployment discards old caches, preserves unrelated caches and fetches new assets", async () => {
    const old = worker();
    await old.lifecycle("install");
    await old.request("/stats");
    await old.request("/_next/static/chunks/app.js");
    await old.caches.open("another-app-cache");
    const next = worker(
      source.replace('"lumina-v2"', '"lumina-v3"'),
      old.stores,
    );
    next.fetch.mockResolvedValue(new Response("new deploy"));
    await next.lifecycle("install");
    await next.lifecycle("activate");
    expect(await next.caches.keys()).toEqual([
      "another-app-cache",
      "lumina-v3-shell",
    ]);
    expect(
      await (await next.request("/_next/static/chunks/app.js")).text(),
    ).toBe("new deploy");
    expect(next.self.skipWaiting).toHaveBeenCalledOnce();
    expect(next.self.clients.claim).toHaveBeenCalledOnce();
    await next.lifecycle("message", { type: "SKIP_WAITING" });
    expect(next.self.skipWaiting).toHaveBeenCalledTimes(2);
  });
});
