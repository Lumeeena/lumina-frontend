import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("analytics API route", () => {
  it("rejects payloads with oversized event field", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: "a".repeat(51),
        sessionId: "test-session",
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects payloads with oversized route field", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: "pageView",
        route: "a".repeat(501),
        sessionId: "test-session",
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects payloads with oversized feature field", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: "featureUsage",
        feature: "a".repeat(101),
        sessionId: "test-session",
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects payloads with oversized sessionId field", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: "pageView",
        sessionId: "a".repeat(51),
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects unknown event names", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: "unknownEvent",
        sessionId: "test-session",
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("accepts valid pageView event", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: "pageView",
        route: "/accounts/GA123",
        sessionId: "test-session",
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("accepts valid featureUsage event", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: "featureUsage",
        feature: "networkSwitcher",
        sessionId: "test-session",
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("honors opt-out header", async () => {
    const request = new Request("http://localhost/api/analytics", {
      method: "POST",
      headers: { "x-analytics-opt-out": "true" },
      body: JSON.stringify({
        event: "pageView",
        sessionId: "test-session",
        timestamp: Date.now(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});
