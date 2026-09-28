/**
 * Browser push notifications for watched activity. Part of #9 / #82.
 *
 * The rule this module exists to enforce: **permission is never requested
 * unprompted.** `Notification.requestPermission()` on page load is the single
 * most common way this feature is implemented badly — it is what makes people
 * block a site permanently, and it burns the one chance a browser gives.
 * So nothing here calls `requestPermission` at all. `enablePush` is the only
 * path to it, it is `async` and returns the resulting state, and its only
 * legitimate caller is a click handler.
 *
 * The other half of "respect the browser's notification settings" is not
 * overriding them: the options built below deliberately omit `silent` and
 * `requireInteraction`, because setting either one is a way of taking the
 * operating system's quiet hours and auto-dismiss preferences away from the
 * person who configured them. See `public/sw.js` for the delivery side.
 *
 * Deliberately free of React, so it is testable in plain Node.
 */

/** Where the worker lives. Must be under the origin root to claim `/`. */
export const SERVICE_WORKER_PATH = "/sw.js";
export const SERVICE_WORKER_SCOPE = "/";

/**
 * The VAPID public key, as the standard base64url string `PushManager.subscribe`
 * wants. Read from the build so a deployment can issue its own key pair.
 */
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Decodes the VAPID key, or null when none is configured or it is malformed. */
export function vapidApplicationServerKey(): Uint8Array | null {
  if (!VAPID_PUBLIC_KEY) return null;
  try {
    const padded = (VAPID_PUBLIC_KEY.length % 4
      ? VAPID_PUBLIC_KEY + "=".repeat(4 - (VAPID_PUBLIC_KEY.length % 4))
      : VAPID_PUBLIC_KEY
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const raw = atob(padded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export type PushState =
  /** No `Notification`, no `ServiceWorkerContainer`, or no `PushManager`. */
  | "unsupported"
  /** The browser can deliver pushes but has not been asked yet. */
  | "default"
  /** Asked and allowed, but no `PushSubscription` exists yet. */
  | "granted"
  /** Asked and refused. Browsers will not ask again; do not prompt. */
  | "denied"
  /** Allowed and subscribed — pushes can be delivered. */
  | "subscribed";

/**
 * Which browser APIs are present. Checked separately from permission because
 * they fail independently: Firefox has no `PushManager` on Android, and a
 * non-secure origin has no service worker at all.
 */
export function pushSupport(): {
  notifications: boolean;
  serviceWorker: boolean;
  pushManager: boolean;
} {
  return {
    notifications: typeof Notification !== "undefined",
    serviceWorker:
      typeof navigator !== "undefined" && "serviceWorker" in navigator,
    pushManager: typeof PushManager !== "undefined",
  };
}

export function pushFullySupported(): boolean {
  const support = pushSupport();
  return support.notifications && support.serviceWorker && support.pushManager;
}

/**
 * Register the worker. Silent: registration shows nothing to the user and asks
 * for nothing, so it is safe on mount. It is still only done here rather than
 * in the layout, so a browser that has blocked service workers does not
 * accumulate a failed registration on every page.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  const support = pushSupport();
  if (!support.serviceWorker) return null;
  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: SERVICE_WORKER_SCOPE,
    });
  } catch {
    // A refused or unsupported registration is a normal outcome, not an error
    // worth surfacing: push degrades to the in-app tray.
    return null;
  }
}

export async function currentPushState(): Promise<PushState> {
  if (!pushFullySupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "default") return "default";
  const registration = await getRegistration();
  if (!registration) return "granted";
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "subscribed" : "granted";
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupport().serviceWorker) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    // `ready` never settles when no worker is active, so it must never be
    // awaited unguarded on a page that has not registered one.
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  }
}

/**
 * Opt in to push. **Must be called from a user gesture.**
 *
 * The ordering is deliberate: register the worker first, then request
 * permission, then subscribe. Asking before the worker is registered produces a
 * permission the user grants and a subscription that cannot exist, which reads
 * as a broken feature.
 */
export async function enablePush(): Promise<PushState> {
  if (!pushFullySupported()) return "unsupported";
  // Never re-prompt after a refusal. Browsers ignore the second request, so
  // calling it would be noise at best and a reset of the site's trust at worst.
  if (Notification.permission === "denied") return "denied";

  const registration = await registerServiceWorker();
  if (!registration) return "unsupported";

  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
  if (permission !== "granted") return permission;

  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return "subscribed";
    // Chrome rejects a subscription with no VAPID key, so an unset
    // `NEXT_PUBLIC_VAPID_PUBLIC_KEY` means push cannot be enabled at all rather
    // than silently subscribing without one.
    const key = vapidApplicationServerKey();
    if (!key) return "granted";
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array(key).buffer as ArrayBuffer,
    });
    return subscription ? "subscribed" : "granted";
  } catch {
    // Allowed but undeliverable — a VAPID problem, or a browser that allows
    // notifications but refuses push. The in-app tray still works.
    return "granted";
  }
}

/** Opt back out, and release the subscription so the backend can drop it. */
export async function disablePush(): Promise<PushState> {
  const registration = await getRegistration();
  if (registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      await subscription?.unsubscribe();
    } catch {
      // Already gone, or the browser will not let go. Nothing to recover.
    }
  }
  return currentPushState();
}

/**
 * Whether the user can see this tab right now.
 *
 * `document.hasFocus` is the honest signal: `visibilityState` alone is
 * "hidden" for a background tab that is still on screen, and a notification
 * for something already visible is an interruption, not an alert.
 */
export function tabIsVisible(): boolean {
  if (typeof document === "undefined") return true;
  if (typeof document.hasFocus === "function" && !document.hasFocus()) return false;
  return document.visibilityState !== "hidden";
}

/**
 * Options for a locally-raised notification.
 *
 * `tag` collapses repeats of the same operation, `data` carries the account so
 * a click can route, and `icon`/`badge` come from the manifest. `silent` and
 * `requireInteraction` are intentionally absent — see the module header.
 */
export function localNotificationOptions(
  notification: { id: string; address: string; transactionHash: string },
): NotificationOptions {
  return {
    tag: notification.id,
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    data: {
      url: `/accounts/${notification.address}`,
      address: notification.address,
      transactionHash: notification.transactionHash,
    },
  };
}

/**
 * Raise an OS notification for an alert, but only if the tab is not visible.
 *
 * Returns whether one was shown, so a caller can record that the delivery
 * already happened rather than raising a second copy.
 */
export async function notifyWhileUnfocused(
  notification: { id: string; address: string; transactionHash: string },
  title: string,
  body: string,
): Promise<boolean> {
  if (!pushSupport().notifications) return false;
  if (Notification.permission !== "granted") return false;
  if (tabIsVisible()) return false;
  const registration = await getRegistration();
  if (!registration) return false;
  try {
    await registration.showNotification(title, {
      body,
      ...localNotificationOptions(notification),
    });
    return true;
  } catch {
    return false;
  }
}
