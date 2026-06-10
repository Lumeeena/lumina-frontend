import { describe, expect, it } from "vitest";
import {
  formatOperationType,
  formatXLM,
  getOperationColor,
  timeAgo,
  truncateAddress,
} from "./formatters";

describe("truncateAddress", () => {
  it("truncates a long address to head...tail", () => {
    expect(truncateAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ234567")).toBe("GABCD...4567");
  });

  it("returns short addresses unchanged", () => {
    expect(truncateAddress("GABC")).toBe("GABC");
  });

  it("returns falsy input unchanged", () => {
    expect(truncateAddress("")).toBe("");
  });

  it("respects a custom character count", () => {
    expect(truncateAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ234567", 6)).toBe("GABCDEF...234567");
  });
});

describe("timeAgo", () => {
  const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

  it("formats seconds", () => {
    expect(timeAgo(new Date(Date.now() - 10_000).toISOString())).toBe("10s ago");
  });

  it("formats minutes", () => {
    expect(timeAgo(minutesAgo(5))).toBe("5m ago");
  });

  it("formats hours", () => {
    expect(timeAgo(minutesAgo(3 * 60))).toBe("3h ago");
  });

  it("formats days", () => {
    expect(timeAgo(minutesAgo(2 * 24 * 60))).toBe("2d ago");
  });
});

describe("formatXLM", () => {
  it("formats a numeric string with grouping", () => {
    expect(formatXLM("1234.5")).toBe("1,234.50");
  });

  it("returns non-numeric input unchanged", () => {
    expect(formatXLM("not-a-number")).toBe("not-a-number");
  });
});

describe("formatOperationType", () => {
  it("title-cases snake_case operation types", () => {
    expect(formatOperationType("create_account")).toBe("Create Account");
  });

  it("handles a single-word type", () => {
    expect(formatOperationType("payment")).toBe("Payment");
  });
});

describe("getOperationColor", () => {
  it("returns the mapped color for a known type", () => {
    expect(getOperationColor("payment")).toBe("text-green-400");
  });

  it("falls back to a default color for an unknown type", () => {
    expect(getOperationColor("some_future_operation")).toBe("text-slate-400");
  });
});
