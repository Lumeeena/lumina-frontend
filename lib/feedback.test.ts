import { describe, expect, it } from "vitest";
import {
  buildFeedbackUrl,
  ISSUE_TRACKER_URL,
  sanitizeRoute,
} from "./feedback";

describe("sanitizeRoute", () => {
  it("preserves the path and drops query strings and fragments", () => {
    expect(sanitizeRoute("/transactions?filter=private#details")).toBe(
      "/transactions",
    );
    expect(sanitizeRoute("/transactions#details")).toBe("/transactions");
  });

  it.each(["", "?filter=private", "#details"])(
    "uses the root route when %j has no pathname",
    (pathname) => {
      expect(sanitizeRoute(pathname)).toBe("/");
    },
  );

  it("redacts every Stellar key, including keys outside account routes", () => {
    const account = `G${"A".repeat(55)}`;
    const contract = `C${"B".repeat(55)}`;
    const muxedAccount = `M${"C".repeat(68)}`;
    const syntheticSecret = `S${"D".repeat(55)}`;

    expect(
      sanitizeRoute(
        `/inspect/${account}/${contract}/${muxedAccount}/${syntheticSecret}`,
      ),
    ).toBe("/inspect/:redacted/:redacted/:redacted/:redacted");
  });
});

describe("buildFeedbackUrl", () => {
  it("prefills the feedback form with the route and app version", () => {
    const url = new URL(
      buildFeedbackUrl({ pathname: "/assets/Atlas & Co", appVersion: "1.2.3" }),
    );

    expect(url.origin + url.pathname).toBe(ISSUE_TRACKER_URL);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      title: "Feedback on /assets/Atlas & Co",
      body: [
        "**What happened:**",
        "",
        "**Steps to reproduce:**",
        "",
        "---",
        "Route: /assets/Atlas & Co",
        "App version: v1.2.3",
      ].join("\n"),
      labels: "feedback",
    });
    expect(url.hash).toBe("");
  });

  it("uses the sanitized route in both the title and the body", () => {
    const account = `G${"A".repeat(55)}`;
    const value = buildFeedbackUrl({
      pathname: `/accounts/${account}?memo=private-memo#private-fragment`,
      appVersion: "1.2.3",
    });
    const params = new URL(value).searchParams;

    expect(params.get("title")).toBe("Feedback on /accounts/:redacted");
    expect(params.get("body")).toContain("Route: /accounts/:redacted");
    expect(value).not.toContain(account);
    expect(value).not.toContain("private-memo");
    expect(value).not.toContain("private-fragment");
  });
});
