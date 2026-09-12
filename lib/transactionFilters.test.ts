import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  applyFilters,
  countActiveFilters,
  filtersFromQueryString,
  filtersToQueryString,
  isEmptyFilters,
  matchesFilters,
  type TransactionFilters,
} from "./transactionFilters";
import type { Transaction } from "./types";

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    hash: "abc123",
    ledger: 100,
    createdAt: "2026-03-15T12:00:00Z",
    sourceAccount: "GABCDEF",
    feeCharged: "1000000", // 0.1 XLM
    operationCount: 2,
    successful: true,
    memoType: null,
    memo: null,
    ...overrides,
  };
}

function filters(overrides: Partial<TransactionFilters> = {}): TransactionFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe("matchesFilters", () => {
  it("accepts everything when nothing is set", () => {
    expect(matchesFilters(tx(), EMPTY_FILTERS)).toBe(true);
    expect(matchesFilters(tx({ successful: false }), EMPTY_FILTERS)).toBe(true);
  });

  it("filters on status", () => {
    expect(matchesFilters(tx({ successful: true }), filters({ status: "successful" }))).toBe(true);
    expect(matchesFilters(tx({ successful: false }), filters({ status: "successful" }))).toBe(false);
    expect(matchesFilters(tx({ successful: false }), filters({ status: "failed" }))).toBe(true);
    expect(matchesFilters(tx({ successful: true }), filters({ status: "failed" }))).toBe(false);
  });

  it("treats a date range as inclusive of both whole days", () => {
    const march15 = tx({ createdAt: "2026-03-15T23:59:59Z" });

    // Someone picking "15 March to 15 March" means that day, not a zero-width
    // instant at midnight.
    expect(matchesFilters(march15, filters({ fromDate: "2026-03-15", toDate: "2026-03-15" }))).toBe(true);
    expect(matchesFilters(march15, filters({ fromDate: "2026-03-16" }))).toBe(false);
    expect(matchesFilters(march15, filters({ toDate: "2026-03-14" }))).toBe(false);
  });

  it("matches a source account by case-insensitive substring", () => {
    const t = tx({ sourceAccount: "GABCDEFXYZ" });
    expect(matchesFilters(t, filters({ source: "cdef" }))).toBe(true);
    expect(matchesFilters(t, filters({ source: "CDEF" }))).toBe(true);
    expect(matchesFilters(t, filters({ source: "nope" }))).toBe(false);
    // Whitespace alone is not a filter.
    expect(matchesFilters(t, filters({ source: "   " }))).toBe(true);
  });

  it("filters on a minimum operation count", () => {
    expect(matchesFilters(tx({ operationCount: 5 }), filters({ minOperations: 5 }))).toBe(true);
    expect(matchesFilters(tx({ operationCount: 4 }), filters({ minOperations: 5 }))).toBe(false);
    // Zero is a real bound, not "unset".
    expect(matchesFilters(tx({ operationCount: 0 }), filters({ minOperations: 0 }))).toBe(true);
  });

  it("compares the fee in XLM, not stroops", () => {
    const oneXlm = tx({ feeCharged: "10000000" });
    expect(matchesFilters(oneXlm, filters({ maxFeeXlm: 1 }))).toBe(true);
    expect(matchesFilters(oneXlm, filters({ maxFeeXlm: 0.5 }))).toBe(false);
  });

  it("rejects a transaction with an unparseable fee rather than letting it through", () => {
    expect(matchesFilters(tx({ feeCharged: "not-a-number" }), filters({ maxFeeXlm: 1 }))).toBe(false);
  });

  it("requires every active filter to match", () => {
    const t = tx({ successful: true, operationCount: 1 });
    expect(matchesFilters(t, filters({ status: "successful", minOperations: 5 }))).toBe(false);
  });
});

describe("applyFilters", () => {
  it("returns the original array untouched when no filter is active", () => {
    const list = [tx({ hash: "a" }), tx({ hash: "b" })];
    expect(applyFilters(list, EMPTY_FILTERS)).toBe(list);
  });

  it("keeps only matching transactions, in order", () => {
    const list = [
      tx({ hash: "a", successful: true }),
      tx({ hash: "b", successful: false }),
      tx({ hash: "c", successful: true }),
    ];
    expect(applyFilters(list, filters({ status: "successful" })).map(t => t.hash)).toEqual(["a", "c"]);
  });
});

describe("countActiveFilters / isEmptyFilters", () => {
  it("counts nothing for the defaults", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(isEmptyFilters(EMPTY_FILTERS)).toBe(true);
  });

  it("counts each set field once", () => {
    expect(countActiveFilters(filters({ status: "failed", source: "GA", maxFeeXlm: 1 }))).toBe(3);
  });

  it("does not count a whitespace-only source", () => {
    expect(countActiveFilters(filters({ source: "  " }))).toBe(0);
  });
});

describe("query-string round trip", () => {
  it("writes nothing for an unfiltered view", () => {
    expect(filtersToQueryString(EMPTY_FILTERS)).toBe("");
  });

  it("restores every field it wrote", () => {
    const original = filters({
      status: "failed",
      fromDate: "2026-01-01",
      toDate: "2026-02-01",
      source: "GABC",
      minOperations: 3,
      maxFeeXlm: 0.5,
    });

    expect(filtersFromQueryString(filtersToQueryString(original))).toEqual(original);
  });

  it("trims the source on the way out so the URL matches what is applied", () => {
    expect(filtersToQueryString(filters({ source: "  GABC  " }))).toBe("source=GABC");
  });

  it("falls back to defaults for junk rather than throwing", () => {
    const parsed = filtersFromQueryString("status=sideways&from=yesterday&minOps=-2&maxFee=abc");
    expect(parsed).toEqual(EMPTY_FILTERS);
  });

  it("rejects a malformed date but keeps the rest of the query", () => {
    const parsed = filtersFromQueryString("from=15-03-2026&status=failed");
    expect(parsed.fromDate).toBeNull();
    expect(parsed.status).toBe("failed");
  });

  it("accepts a URLSearchParams as well as a string", () => {
    expect(filtersFromQueryString(new URLSearchParams("status=successful")).status).toBe("successful");
  });

  it("round-trips a zero bound, which is meaningfully different from unset", () => {
    const parsed = filtersFromQueryString(filtersToQueryString(filters({ minOperations: 0 })));
    expect(parsed.minOperations).toBe(0);
  });
});
