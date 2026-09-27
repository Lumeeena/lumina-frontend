# Push notifications

Push notifications are **off by default and never asked for on their own.**
Nothing in Lumina calls `Notification.requestPermission()` during a normal page
load. The prompt appears only when someone clicks **Enable push notifications**
on `/watch`.

This is deliberate. A permission prompt that appears without being asked for is
the fastest way to get a site blocked permanently, and browsers then never show
the prompt again.

## What is on the client

| File | Responsibility |
| --- | --- |
| `lib/pushNotifications.ts` | Support detection, opt-in, VAPID key, foreground notification |
| `public/sw.js` | Receives `push`, renders the notification, handles clicks |
| `components/PushOptIn.tsx` | The only caller allowed to request permission |
| `components/WatchActivityWatcher.tsx` | Records alerts and notifies when the tab is unfocused |

`/watch` renders a foreground notification through the service worker when the
tab is hidden or unfocused. If you are looking at the page, the in-app bell
updates instead and no system notification is raised. Quiet hours and
auto-dismiss are left to the operating system: no notification is sent with
`silent` or `requireInteraction`, so the settings the user configured there are
the settings they get here.

## Configuration

Set the VAPID public key. Without it a browser will reject any subscription, so
push is reported as unavailable rather than silently half-working.

```sh
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your base64url VAPID public key>
```

Generate a pair with `npx web-push generate-vapid-keys`. Keep the private key
out of the frontend — it belongs to whatever sends the notifications.

## What the backend must provide

**The backend does not exist yet.** This is the deliberate scope of the issue:
the client is complete and testable, and delivery is a separate service. Until
one exists, push works only while a Lumina tab is open in the background.

A push service such as [web-push](https://github.com/web-push/web-push-js) needs
three things, none of which the frontend can do for you.

### 1. A subscribe endpoint

The browser subscription carries a private key. **It must be sent to the server
and stored there.** The client has no reason to keep it, and the server cannot
send anything without it.

```
POST /api/push/subscribe
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": { "p256dh": "...", "auth": "..." },
  "address": "GABC...",   // which watch the subscription belongs to
  "filters": { "operationType": "PAYMENT", "minAmount": 1000 }
}
```

Respond `201` with `{ "ok": true }`. Treat a repeat `POST` from the same
`endpoint` as an update, not an error — subscriptions are recreated on every
browser restart, so a duplicate is normal.

### 2. The send path

For each matching operation, send to every stored subscription for that address:

```js
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:you@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

await webpush.sendNotification(
  subscription,
  JSON.stringify({
    title: "Payment on GABC…",
    body: "100 XLM",
    url: "/accounts/GABC…",
  }),
);
```

Send `url` as the account path. `public/sw.js` reads it and opens that route,
which is what makes a notification clickable. Everything else about the payload
is optional; the worker falls back to `/` when `url` is absent.

### 3. Cleanup

`disablePush()` unsubscribes and the client calls nothing — the server owns the
endpoint. On a `push` failure with status **404 or 410**, delete the stored
subscription: the browser has discarded it, and every later send to it fails
forever. This is the single most common way a push backend rots.

## Testing

```sh
npx vitest run lib/pushNotifications.test.ts
```

`lib/pushNotifications.test.ts` asserts the property that matters most: reading
current state, registering the worker, and checking tab visibility **never**
request permission. Only `enablePush` does, and it does not re-prompt after a
refusal, because browsers ignore the second ask.
