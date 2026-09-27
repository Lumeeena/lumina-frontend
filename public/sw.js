/**
 * Lumina's push notification service worker. Part of #9 / #82.
 *
 * Plain JavaScript with no build step, because that is what a service worker
 * has to be: it is fetched by the browser at the origin root, outside the
 * module graph, so anything the bundler produces would not be there to load.
 *
 * It handles two things and nothing else. A `push` event carrying an alert
 * payload, and a click on one of those alerts. There is no cache and no
 * fetch handler on purpose — a stale cache served by a worker that is supposed
 * to be about alerting is a confusing thing to debug, and this app is better
 * offline by simply not being a PWA.
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

self.addEventListener("install", () => {
  // Take over straight away: a watch that has just been opted into should not
  // need a second reload before its worker can receive a push.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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

  event.waitUntil(self.registration.showNotification(title, { body, ...options }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const target =
    typeof data.url === "string" && data.url ? data.url : "/watch";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
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
      },
    ),
  );
});
