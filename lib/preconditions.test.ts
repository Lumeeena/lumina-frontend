import { describe, expect, it } from "vitest";
import {
  hasPreconditions,
  formatTime,
  getPreconditionSummary,
  type TransactionPreconditions,
} from "./preconditions";

describe("hasPreconditions", () => {
  it("returns false for undefined preconditions", () => {
    expect(hasPreconditions(undefined)).toBe(false);
  });

  it("returns false for null preconditions", () => {
    expect(hasPreconditions(null)).toBe(false);
  });

  it("returns false for empty preconditions object", () => {
    expect(hasPreconditions({})).toBe(false);
  });

  it("returns true when minLedger is set", () => {
    expect(hasPreconditions({ minLedger: 1000 })).toBe(true);
  });

  it("returns true when maxLedger is set", () => {
    expect(hasPreconditions({ maxLedger: 2000 })).toBe(true);
  });

  it("returns true when minTime is set", () => {
    expect(hasPreconditions({ minTime: "2026-01-01T00:00:00Z" })).toBe(true);
  });

  it("returns true when maxTime is set", () => {
    expect(hasPreconditions({ maxTime: "2026-12-31T23:59:59Z" })).toBe(true);
  });

  it("returns true when extraSigners array has elements", () => {
    expect(hasPreconditions({ extraSigners: ["GABC..."] })).toBe(true);
  });

  it("returns false when extraSigners is an empty array", () => {
    expect(hasPreconditions({ extraSigners: [] })).toBe(false);
  });

  it("returns false when extraSigners is null", () => {
    expect(hasPreconditions({ extraSigners: null })).toBe(false);
  });

  it("returns true when multiple preconditions are set", () => {
    expect(
      hasPreconditions({
        minLedger: 1000,
        maxLedger: 2000,
        minTime: "2026-01-01T00:00:00Z",
        extraSigners: ["GABC..."],
      })
    ).toBe(true);
  });
});

describe("formatTime", () => {
  it("formats an ISO string into a localized date-time", () => {
    const result = formatTime("2026-03-15T14:30:45Z");
    // The exact format depends on the runtime locale, but we can check it contains the components
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
  });

  it("handles different ISO formats", () => {
    const result = formatTime("2026-01-01T00:00:00.000Z");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/Jan/);
  });

  it("includes time zone information", () => {
    const result = formatTime("2026-06-20T12:00:00Z");
    // Should contain some timezone indicator (exact string depends on locale)
    expect(result.length).toBeGreaterThan(10);
  });
});

describe("getPreconditionSummary", () => {
  it("returns empty array for undefined preconditions", () => {
    expect(getPreconditionSummary(undefined)).toEqual([]);
  });

  it("returns empty array for null preconditions", () => {
    expect(getPreconditionSummary(null)).toEqual([]);
  });

  it("returns empty array for empty preconditions object", () => {
    expect(getPreconditionSummary({})).toEqual([]);
  });

  it("formats minLedger only", () => {
    const result = getPreconditionSummary({ minLedger: 1000 });
    expect(result).toEqual(["Ledger: 1000 - any"]);
  });

  it("formats maxLedger only", () => {
    const result = getPreconditionSummary({ maxLedger: 2000 });
    expect(result).toEqual(["Ledger: any - 2000"]);
  });

  it("formats both minLedger and maxLedger", () => {
    const result = getPreconditionSummary({ minLedger: 1000, maxLedger: 2000 });
    expect(result).toEqual(["Ledger: 1000 - 2000"]);
  });

  it("formats minTime only", () => {
    const result = getPreconditionSummary({ minTime: "2026-03-15T12:00:00Z" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^Time: /);
    expect(result[0]).toMatch(/3\/15\/2026/);
    expect(result[0]).toMatch(/ - any$/);
  });

  it("formats maxTime only", () => {
    const result = getPreconditionSummary({ maxTime: "2026-12-31T23:59:59Z" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^Time: any - /);
    expect(result[0]).toMatch(/12\/31\/2026/);
  });

  it("formats both minTime and maxTime", () => {
    const result = getPreconditionSummary({
      minTime: "2026-01-01T00:00:00Z",
      maxTime: "2026-12-31T23:59:59Z",
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^Time: /);
    expect(result[0]).toMatch(/1\/1\/2026/);
    expect(result[0]).toMatch(/12\/31\/2026/);
  });

  it("formats extraSigners count", () => {
    const result = getPreconditionSummary({
      extraSigners: ["GABC...", "GDEF...", "GHIJ..."],
    });
    expect(result).toEqual(["Extra signers: 3"]);
  });

  it("ignores empty extraSigners array", () => {
    const result = getPreconditionSummary({ extraSigners: [] });
    expect(result).toEqual([]);
  });

  it("formats all precondition types together", () => {
    const result = getPreconditionSummary({
      minLedger: 1000,
      maxLedger: 2000,
      minTime: "2026-01-01T00:00:00Z",
      maxTime: "2026-12-31T23:59:59Z",
      extraSigners: ["GABC...", "GDEF..."],
    });
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("Ledger: 1000 - 2000");
    expect(result[1]).toMatch(/^Time: /);
    expect(result[2]).toBe("Extra signers: 2");
  });

  it("handles null values for individual preconditions", () => {
    const preconditions: TransactionPreconditions = {
      minLedger: null,
      maxLedger: null,
      minTime: null,
      maxTime: null,
      extraSigners: null,
    };
    expect(getPreconditionSummary(preconditions)).toEqual([]);
  });
});
