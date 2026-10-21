/**
 * Lumina's push notification service worker. Part of #9 / #82.
 *
 * Plain JavaScript with no build step, because that is what a service worker
 * has to be: it is fetched by the browser at the origin root, outside the
 * module graph, so anything the bundler produces would not be there to load.
 *
 * It handles push alerts and a cached static application shell. Navigation
 * and API data stay network-first, while immutable build assets are
 * cache-first. Data expires after five minutes offline. Bumping CACHE_VERSION
 * gives deployments a deterministic update path: install the new cache,
 * activate immediately, then remove old caches.
 *
 * Delivery: a payload shaped like
 *   { "title": string, "body": string, "address": string,
 *     "transactionHash": string, "operationId": string }
 * Anything missing falls back rather than dropping the alert, because an
 * unformatted notification is still worth more than silence.
 *
 * `silent` and `requireInteraction` are never set. Setting either would
 * override the operating system's quiet hours and auto-dismiss preferences,
 * which the person who configured them expected to be in charge.
 */

/* global self */

const CACHE_VERSION = "lumina-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
// Explorer data must never silently survive an indefinite offline session.
const DATA_MAX_AGE_MS = 5 * 60 * 1000;
const CACHED_AT = "X-Lumina-Cached-At";
const APP_SHELL = [
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  // Take over straight away: a watch that has just been opted into should not
  // need a second reload before its worker can receive a push.
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter(
                (name) =>
                  name.startsWith("lumina-") &&
                  ![SHELL_CACHE, ASSET_CACHE, DATA_CACHE].includes(name),
              )
              .map((name) => caches.delete(name)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

function isAsset(request) {
  const url = new URL(request.url);
  return (
    url.origin === self.location.origin &&
    (APP_SHELL.includes(url.pathname) ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      ["style", "script", "font", "image"].includes(request.destination))
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached =
    (await cache.match(request)) ??
    (await (await caches.open(SHELL_CACHE)).match(request));
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    try {
      await cache.put(request, response.clone());
    } catch {
      // A full cache must not prevent the browser from loading a live asset.
    }
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      const savedAt = Number(cached.headers.get(CACHED_AT));
      const age = Date.now() - savedAt;
      if (savedAt > 0 && age >= 0 && age < DATA_MAX_AGE_MS) return cached;
      await cache.delete(request);
    }
    throw error;
  }
  try {
    if (
      response.ok &&
      !/\bno-store\b/i.test(response.headers.get("Cache-Control") ?? "")
    ) {
      const copy = response.clone();
      const headers = new Headers(copy.headers);
      headers.set(CACHED_AT, String(Date.now()));
      await cache.put(
        request,
        new Response(await copy.blob(), {
          status: copy.status,
          statusText: copy.statusText,
          headers,
        }),
      );
    } else {
      // An authoritative failure or no-store response invalidates older success.
      await cache.delete(request);
    }
  } catch {
    // Cache quota/permission failures must not replace a successful live response.
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (
    request.method !== "GET" ||
    new URL(request.url).protocol === "chrome-extension:"
  )
    return;
  event.respondWith(
    isAsset(request) ? cacheFirst(request) : networkFirst(request),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

/** Pull a display string out of a payload that may be anything at all. */
function readPayload(event) {
  if (!event.data) return {};
  try {
    const parsed = event.data.json();
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    // Not JSON. A sender is allowed to push a bare string, and some do.
    try {
      return { body: event.data.text() };
    } catch {
      return {};
    }
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);

  const title =
    typeof payload.title === "string" && payload.title
      ? payload.title
      : "Watched address activity";

  const body =
    typeof payload.body === "string" && payload.body
      ? payload.body
      : "A watched address was active.";

  const address = typeof payload.address === "string" ? payload.address : "";
  const operationId =
    typeof payload.operationId === "string" ? payload.operationId : "";

  const options = {
    // The tag is what collapses a burst of alerts for one operation into a
    // single notification, so a reconnect that replays subscriptions does not
    // produce the same alert five times.
    tag: address && operationId ? `${address}:${operationId}` : undefined,
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    data: {
      url: address ? `/accounts/${address}` : "/watch",
      address,
      transactionHash:
        typeof payload.transactionHash === "string"
          ? payload.transactionHash
          : "",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, { body, ...options }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const target = typeof data.url === "string" && data.url ? data.url : "/watch";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Prefer an existing window: opening a second tab for an alert the
        // person can already see is the most common complaint about push.
        for (const client of clientList) {
          if ("focus" in client) {
            if ("navigate" in client && client.url !== target) {
              return client.navigate(target).then((navigated) => {
                if (navigated) return navigated.focus();
                return undefined;
              });
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
