import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "./i18n";
import {
  formatOperationType,
  formatStroops,
  formatXLM,
  getOperationColor,
  timeAgo,
  truncateAddress,
} from "./formatters";

afterEach(() => setLocale("en"));

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
    expect(timeAgo(new Date(Date.now() - 10_000).toISOString())).toMatch(/10.*s/);
  });

  it("formats minutes", () => {
    expect(timeAgo(minutesAgo(5))).toMatch(/5.*m/);
  });

  it("formats hours", () => {
    expect(timeAgo(minutesAgo(3 * 60))).toMatch(/3.*h/);
  });

  it("formats days", () => {
    expect(timeAgo(minutesAgo(2 * 24 * 60))).toMatch(/2.*d/);
  });

  it("formats with German locale", () => {
    setLocale("de");
    const result = timeAgo(new Date(Date.now() - 10_000).toISOString());
    expect(result).toMatch(/10/);
  });
});

describe("formatXLM", () => {
  it("formats a numeric string with grouping", () => {
    expect(formatXLM("1234.5")).toBe("1,234.50");
  });

  it("returns non-numeric input unchanged", () => {
    expect(formatXLM("not-a-number")).toBe("not-a-number");
  });

  it("formats with German locale (comma as decimal)", () => {
    setLocale("de");
    const result = formatXLM("1234.5");
    expect(result).toContain("234");
    expect(result).toContain("50");
  });
});

describe("formatStroops", () => {
  it("formats whole stroops without a trailing fraction", () => {
    expect(formatStroops(BigInt(10_000_000))).toBe("1");
  });

  it("formats fractional stroops to 7 decimals, trimming trailing zeros", () => {
    expect(formatStroops(BigInt(1_250_000_000))).toBe("125");
    expect(formatStroops(BigInt(123_456_789))).toBe("12.3456789");
  });

  it("groups thousands", () => {
    expect(formatStroops(BigInt(12_345_678_900_000))).toBe("1,234,567.89");
  });

  it("accepts number and string input", () => {
    expect(formatStroops(50_000_000)).toBe("5");
    expect(formatStroops("50000000")).toBe("5");
  });

  it("formats zero", () => {
    expect(formatStroops(BigInt(0))).toBe("0");
  });

  it("formats large stroops with locale-aware grouping", () => {
    setLocale("de");
    const result = formatStroops(BigInt(12_345_678_900_000));
    expect(result).toContain("234");
    expect(result).toContain("567");
    expect(result).toContain("89");
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
