import { describe, expect, it } from "vitest";
import { findLedgerGaps } from "./ledgerGaps";

describe("findLedgerGaps", () => {
  it("finds nothing in a contiguous run", () => {
    expect(findLedgerGaps([105, 104, 103, 102])).toEqual([]);
  });

  it("finds nothing with fewer than two ledgers", () => {
    expect(findLedgerGaps([])).toEqual([]);
    expect(findLedgerGaps([42])).toEqual([]);
  });

  it("reports a single missing ledger as a one-ledger range", () => {
    expect(findLedgerGaps([105, 103])).toEqual([
      { startLedger: 104, endLedger: 104 },
    ]);
  });

  it("reports every gap on the page, newest first", () => {
    expect(findLedgerGaps([200, 199, 150, 149, 100])).toEqual([
      { startLedger: 151, endLedger: 198 },
      { startLedger: 101, endLedger: 148 },
    ]);
  });

  it("does not depend on the rows arriving newest first", () => {
    expect(findLedgerGaps([100, 200, 150])).toEqual([
      { startLedger: 151, endLedger: 199 },
      { startLedger: 101, endLedger: 149 },
    ]);
  });

  it("treats a repeated row as one ledger, not a gap", () => {
    expect(findLedgerGaps([10, 10, 9])).toEqual([]);
  });
});
