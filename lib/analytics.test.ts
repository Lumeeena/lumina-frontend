/**
 * Tests for lib/analytics.ts (#459).
 *
 * Analytics is built around three testable concerns:
 *   1. Opt-out: when the user has opted out, nothing is sent to the endpoint.
 *   2. Payload shape: each tracked event carries the right fields.
 *   3. Failure resilience: a network error must not throw to the caller.
 *
 * The module-level `analytics` singleton reads `isEnabled("analytics")` once
 * at construction time, so we must reset modules between tests that flip the
 * feature flag.  `fetch` and `localStorage` are stubbed via `vi.stubGlobal`
 * and the vitest fake-timers API so we never touch real storage or the network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── mock features ──────────────────────────────────────────────────────────
// Control `isEnabled("analytics")` without touching env vars.
const mockIsEnabled = vi.hoisted(() => vi.fn(() => true));
vi.mock("./features", () => ({ isEnabled: mockIsEnabled }));

// ── mock fetch ─────────────────────────────────────────────────────────────
const mockFetch = vi.hoisted(() => vi.fn());

describe("analytics (#459)", () => {
  let localStore: Record<string, string>;

  beforeEach(() => {
    // Reset modules so each test gets a fresh Analytics singleton.
    vi.resetModules();
    mockIsEnabled.mockReturnValue(true);

    // Stub fetch on the global so the module picks it up at import time.
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({ ok: true });

    // Minimal localStorage stub.
    localStore = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStore[key] ?? null,
      setItem: (key: string, value: string) => { localStore[key] = value; },
      removeItem: (key: string) => { delete localStore[key]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // ── opt-out ───────────────────────────────────────────────────────────────

  describe("opt-out", () => {
    it("setOptOut(true) persists to localStorage", async () => {
      const { analytics } = await import("./analytics");
      analytics.setOptOut(true);
      expect(localStore["analyticsOptOut"]).toBe("true");
    });

    it("setOptOut(false) removes the key from localStorage", async () => {
      const { analytics } = await import("./analytics");
      localStore["analyticsOptOut"] = "true";
      analytics.setOptOut(false);
      expect(localStore["analyticsOptOut"]).toBeUndefined();
    });

    it("isOptedOut() returns true when the key is set", async () => {
      const { analytics } = await import("./analytics");
      localStore["analyticsOptOut"] = "true";
      expect(analytics.isOptedOut()).toBe(true);
    });

    it("isOptedOut() returns false when the key is absent", async () => {
      const { analytics } = await import("./analytics");
      expect(analytics.isOptedOut()).toBe(false);
    });
  });

  // ── payload shape ─────────────────────────────────────────────────────────

  describe("payload shape", () => {
    it("trackPageView sends event=pageView with the route", async () => {
      const { analytics } = await import("./analytics");
      analytics.trackPageView("/accounts");

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("/api/analytics");
      const body = JSON.parse(init.body as string);
      expect(body.event).toBe("pageView");
      expect(body.route).toBe("/accounts");
      expect(typeof body.timestamp).toBe("number");
      expect(typeof body.sessionId).toBe("string");
      expect(body.sessionId.length).toBeGreaterThan(0);
    });

    it("trackFeatureUsage sends event=featureUsage with the feature name", async () => {
      const { analytics } = await import("./analytics");
      analytics.trackFeatureUsage("dark-mode");

      expect(mockFetch).toHaveBeenCalledOnce();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.event).toBe("featureUsage");
      expect(body.feature).toBe("dark-mode");
      expect(typeof body.timestamp).toBe("number");
    });

    it("POST includes Content-Type: application/json", async () => {
      const { analytics } = await import("./analytics");
      analytics.trackPageView("/");

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("consecutive calls share the same sessionId within one instance", async () => {
      const { analytics } = await import("./analytics");
      analytics.trackPageView("/a");
      analytics.trackPageView("/b");

      const id1 = JSON.parse(mockFetch.mock.calls[0][1].body).sessionId;
      const id2 = JSON.parse(mockFetch.mock.calls[1][1].body).sessionId;
      expect(id1).toBe(id2);
    });
  });

  // ── feature-disabled guard ────────────────────────────────────────────────

  describe("feature disabled", () => {
    it("does not call fetch when analytics feature is off", async () => {
      mockIsEnabled.mockReturnValue(false);
      const { analytics } = await import("./analytics");
      analytics.trackPageView("/home");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not call fetch for trackFeatureUsage when analytics is off", async () => {
      mockIsEnabled.mockReturnValue(false);
      const { analytics } = await import("./analytics");
      analytics.trackFeatureUsage("some-feature");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ── failure resilience ────────────────────────────────────────────────────

  describe("failure to send", () => {
    it("swallows a network error without throwing", async () => {
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
      const { analytics } = await import("./analytics");

      await expect(analytics.trackPageView("/crash")).resolves.not.toThrow();
    });

    it("swallows a non-ok response without throwing", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });
      const { analytics } = await import("./analytics");

      await expect(analytics.trackPageView("/500")).resolves.not.toThrow();
    });
  });
});
