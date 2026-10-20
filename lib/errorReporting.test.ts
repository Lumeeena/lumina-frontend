// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { REDACTED, reportError, sanitizeError } from "./errorReporting";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("error reporting", () => {
  it("scrubs addresses, personal data, and URL query values", () => {
    window.history.replaceState(
      {},
      "",
      `/accounts/${ADDRESS}?email=user@example.com`,
    );
    const report = sanitizeError(
      new Error(
        `Account ${ADDRESS} belongs to user@example.com at 192.168.1.4`,
      ),
      "boundary",
    );

    expect(report.message).not.toContain(ADDRESS);
    expect(report.message).not.toContain("user@example.com");
    expect(report.message).not.toContain("192.168.1.4");
    expect(report.message).toContain(REDACTED);
    expect(report.url).toBe(`${window.location.origin}/accounts/${REDACTED}`);
    expect(report.url).not.toContain("email=");
  });

  it("is off by default", async () => {
    const request = vi.spyOn(globalThis, "fetch");
    await reportError(new Error("boom"), "error");
    expect(request).not.toHaveBeenCalled();
  });

  it("sends sanitized reports when configured", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_ERROR_REPORTING_URL",
      "https://errors.example/report",
    );
    const request = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response());
    await reportError(new Error(`Failed for ${ADDRESS}`), "boundary");

    expect(request).toHaveBeenCalledOnce();
    expect(String(request.mock.calls[0][1]?.body)).not.toContain(ADDRESS);
  });
});
