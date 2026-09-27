// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SERVICE_WORKER_PATH,
  currentPushState,
  disablePush,
  enablePush,
  localNotificationOptions,
  notifyWhileUnfocused,
  pushFullySupported,
  pushSupport,
  registerServiceWorker,
  tabIsVisible,
  vapidApplicationServerKey,
  type PushState,
} from "./pushNotifications";

/** Records every call, so a test can assert on what was *not* called. */
function browser(options: {
  permission?: NotificationPermission;
  serviceWorker?: boolean;
  pushManager?: boolean;
  registerThrows?: boolean;
  subscribeRejects?: boolean;
  hasSubscription?: boolean;
}) {
  const {
    permission = "default",
    serviceWorker = true,
    pushManager = true,
    registerThrows = false,
    subscribeRejects = false,
    hasSubscription = false,
  } = options;

  const subscription = { unsubscribe: vi.fn().mockResolvedValue(true) };
  const registration = {
    showNotification: vi.fn().mockResolvedValue(undefined),
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(
        hasSubscription ? subscription : null,
      ),
      subscribe: vi
        .fn()
        .mockImplementation(() =>
          subscribeRejects
            ? Promise.reject(new Error("no vapid"))
            : Promise.resolve(subscription),
        ),
    },
  };

  const requestPermission = vi.fn().mockResolvedValue(permission);
  const register = vi
    .fn()
    .mockImplementation(() =>
      registerThrows
        ? Promise.reject(new Error("blocked"))
        : Promise.resolve(registration),
    );

  const g = globalThis as Record<string, unknown>;
  const previous = {
    Notification: g.Notification,
    PushManager: g.PushManager,
    serviceWorker: g.navigator && (g.navigator as Navigator).serviceWorker,
  };

  g.Notification = permission === null ? undefined : { permission, requestPermission };
  g.PushManager = pushManager ? function PushManagerStub() {} : undefined;

  if (g.navigator) {
    if (serviceWorker) {
      Object.defineProperty(g.navigator, "serviceWorker", {
        configurable: true,
        value: { register, ready: Promise.resolve(registration), getRegistration: () => Promise.resolve(registration) },
      });
    } else {
      delete (g.navigator as { serviceWorker?: unknown }).serviceWorker;
    }
  }

  return { registration, subscription, requestPermission, register, previous };
}

function restore(previous: Record<string, unknown>) {
  const g = globalThis as Record<string, unknown>;
  for (const [key, value] of Object.entries(previous)) {
    if (key === "serviceWorker") continue;
    if (value === undefined) delete g[key];
    else g[key] = value;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("support detection", () => {
  it("reports each browser API separately, because they fail independently", () => {
    const env = browser({ pushManager: false });
    const support = pushSupport();

    expect(support.notifications).toBe(true);
    expect(support.serviceWorker).toBe(true);
    expect(support.pushManager).toBe(false);
    expect(pushFullySupported()).toBe(false);
    restore(env.previous);
  });

  it("reports no notification support at all when the constructor is missing", () => {
    const env = browser({ permission: null as never });

    expect(pushSupport().notifications).toBe(false);
    restore(env.previous);
  });
});

describe("permission is never requested unprompted", () => {
  // The point of the whole module. A prompt on page load is the fastest way to
  // get a site blocked permanently.
  it("does not request permission when reading the current state", async () => {
    const env = browser({});

    expect(await currentPushState()).toBe("default");
    expect(env.requestPermission).not.toHaveBeenCalled();

    restore(env.previous);
  });

  it("does not request permission when registering the worker", async () => {
    const env = browser({});

    await registerServiceWorker();

    expect(env.requestPermission).not.toHaveBeenCalled();
    restore(env.previous);
  });

  it("does not request permission when checking whether the tab is visible", () => {
    const env = browser({});

    tabIsVisible();

    expect(env.requestPermission).not.toHaveBeenCalled();
    restore(env.previous);
  });

  it("requests permission only from enablePush, and only once", async () => {
    const env = browser({ permission: "granted" as NotificationPermission });

    const state = await enablePush();

    expect(env.requestPermission).toHaveBeenCalledTimes(1);
    // Granted but no VAPID key configured, so the subscription is not possible.
    expect(state).toBe("granted");
    restore(env.previous);
  });

  it("never re-prompts after a refusal, because browsers ignore the second ask", async () => {
    const env = browser({ permission: "denied" as NotificationPermission });

    expect(await enablePush()).toBe("denied");
    expect(env.requestPermission).not.toHaveBeenCalled();
    expect(await currentPushState()).toBe("denied");
    restore(env.previous);
  });
});

describe("enablePush", () => {
  it("registers the worker before asking, so a granted permission is usable", async () => {
    const env = browser({ permission: "granted" as NotificationPermission });

    await enablePush();

    expect(env.register).toHaveBeenCalledWith(SERVICE_WORKER_PATH, { scope: "/" });
    restore(env.previous);
  });

  it("returns a real state for every outcome", async () => {
    const cases: Array<[Parameters<typeof browser>[0], PushState]> = [
      [{ serviceWorker: false }, "unsupported"],
      [{ permission: "denied" as NotificationPermission }, "denied"],
      [{ registerThrows: true }, "unsupported"],
      [{ permission: "granted" as NotificationPermission, hasSubscription: true }, "subscribed"],
      [
        { permission: "granted" as NotificationPermission, subscribeRejects: true },
        "granted",
      ],
    ];

    for (const [options, expected] of cases) {
      const env = browser(options);
      expect(await enablePush()).toBe(expected);
      restore(env.previous);
    }
  });
});

describe("disablePush", () => {
  it("unsubscribes so the backend can drop the endpoint", async () => {
    const env = browser({ hasSubscription: true });

    await disablePush();

    expect(env.subscription.unsubscribe).toHaveBeenCalledTimes(1);
    restore(env.previous);
  });
});

describe("tabIsVisible", () => {
  it("treats a hidden document as not visible", () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    expect(tabIsVisible()).toBe(false);
  });

  it("treats a visible but unfocused window as not visible", () => {
    // A background window can still be on screen; notifying for something the
    // user can already see is an interruption rather than an alert.
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
    expect(tabIsVisible()).toBe(false);
  });

  it("treats a focused visible tab as visible", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    expect(tabIsVisible()).toBe(true);
  });
});

describe("notification options", () => {
  it("carries the account so a click can route to it", () => {
    const options = localNotificationOptions({
      id: "GA:op-1",
      address: "GA",
      transactionHash: "abc",
    });

    expect(options.tag).toBe("GA:op-1");
    expect((options.data as { url: string }).url).toBe("/accounts/GA");
  });

  it("does not override the operating system's notification settings", () => {
    // `silent` and `requireInteraction` are how an app takes quiet hours and
    // auto-dismiss away from the person who configured them. Omitting both
    // leaves the decision where the user put it.
    const options = localNotificationOptions({ id: "a", address: "GA", transactionHash: "b" });

    expect(options).not.toHaveProperty("silent");
    expect(options).not.toHaveProperty("requireInteraction");
  });
});

describe("notifyWhileUnfocused", () => {
  it("does not notify for a tab the user is looking at", async () => {
    const env = browser({ permission: "granted" as NotificationPermission });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    vi.spyOn(document, "hasFocus").mockReturnValue(true);

    expect(await notifyWhileUnfocused({ id: "a", address: "GA", transactionHash: "b" }, "t", "b")).toBe(false);
    expect(env.registration.showNotification).not.toHaveBeenCalled();
    restore(env.previous);
  });

  it("notifies when the tab is in the background", async () => {
    const env = browser({ permission: "granted" as NotificationPermission });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");

    const shown = await notifyWhileUnfocused(
      { id: "GA:op-1", address: "GA", transactionHash: "b" },
      "Activity on GA",
      "Payment · 100 XLM",
    );

    expect(shown).toBe(true);
    expect(env.registration.showNotification).toHaveBeenCalledWith(
      "Activity on GA",
      expect.objectContaining({ body: "Payment · 100 XLM", tag: "GA:op-1" }),
    );
    restore(env.previous);
  });

  it("does nothing when permission was never granted", async () => {
    const env = browser({ permission: "default" });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");

    expect(await notifyWhileUnfocused({ id: "a", address: "GA", transactionHash: "b" }, "t", "b")).toBe(false);
    expect(env.registration.showNotification).not.toHaveBeenCalled();
    restore(env.previous);
  });
});

describe("vapidApplicationServerKey", () => {
  it("is null when no key is configured, so push is reported as unconfigured", () => {
    // Chrome rejects a subscription with no applicationServerKey, so an unset
    // key has to mean "cannot enable", not "subscribe without one".
    expect(vapidApplicationServerKey()).toBeNull();
  });
});
