/**
 * Lumina's push notification service worker. Part of #9 / #82.
 *
 * Plain JavaScript with no build step, because that is what a service worker
 * has to be: it is fetched by the browser at the origin root, outside the
 * module graph, so anything the bundler produces would not be there to load.
 *
 * It handles push alerts and an offline-first application shell. Navigation
 * and API data stay network-first, while immutable build assets are
 * cache-first. Bumping CACHE_VERSION gives deployments a deterministic update
 * path: install the new cache, activate immediately, then remove old caches.
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

const CACHE_VERSION = "lumina-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const APP_SHELL = [
  "/",
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
                  name.startsWith("lumina-") && !name.startsWith(CACHE_VERSION),
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
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      ["style", "script", "font", "image"].includes(request.destination))
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok)
    (await caches.open(ASSET_CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET")
      await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached =
      request.method === "GET" ? await cache.match(request) : undefined;
    if (cached) return cached;
    if (request.mode === "navigate") {
      const shell = await caches.match("/");
      if (shell) return shell;
    }
    throw error;
  }
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
