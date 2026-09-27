import { describe, expect, it } from "vitest";
import type { Transaction } from "./types";
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
import {
  DEFAULT_OPERATION_FILTERS,
  EMPTY_OPERATION_FILTERS,
  OPERATION_TYPE_FILTERS,
  applyOperationFilters,
  countActiveOperationFilters,
  isEmptyOperationFilters,
  matchesOperationFilters,
  normaliseOperationFilters,
  operationAsset,
  operationFiltersFromQueryString,
  operationFiltersToQueryString,
  type OperationFilters,
} from "./operationFilters";
import type { Operation } from "./types";

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    hash: "a".repeat(64),
    ledger: 1000,
    createdAt: "2026-03-01T12:00:00Z",
    sourceAccount: "GABC",
    feeCharged: "100",
    operationCount: 1,
    successful: true,
    ...overrides,
  } as Transaction;
}

function op(overrides: Partial<Operation> = {}): Operation {
  return {
    id: "op-1",
    type: "PAYMENT",
    createdAt: "2026-03-01T12:00:00Z",
    transactionHash: "b".repeat(64),
    sourceAccount: "GABC",
    from: "GABC",
    to: "GDEF",
    amount: "100",
    asset: null,
    ...overrides,
  } as Operation;
}

describe("transactionFilters (unchanged behaviour, shared implementation)", () => {
  it("counts only the fields that are set", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(isEmptyFilters(EMPTY_FILTERS)).toBe(true);
    expect(
      countActiveFilters({ ...EMPTY_FILTERS, status: "failed", source: "G" }),
    ).toBe(2);
  });

  it("does not count a blank text box as a filter", () => {
    expect(countActiveFilters({ ...EMPTY_FILTERS, source: "   " })).toBe(0);
  });

  it("matches a same-day range inclusively", () => {
    const filters: TransactionFilters = {
      ...EMPTY_FILTERS,
      fromDate: "2026-03-01",
      toDate: "2026-03-01",
    };
    expect(matchesFilters(tx({ createdAt: "2026-03-01T00:00:01Z" }), filters)).toBe(true);
    expect(matchesFilters(tx({ createdAt: "2026-03-01T23:59:59Z" }), filters)).toBe(true);
    expect(matchesFilters(tx({ createdAt: "2026-02-28T23:59:59Z" }), filters)).toBe(false);
  });

  it("excludes a fee that is not a number from a maximum-fee filter", () => {
    const filters = { ...EMPTY_FILTERS, maxFeeXlm: 0.00001 };
    expect(matchesFilters(tx({ feeCharged: "100" }), filters)).toBe(true);
    expect(matchesFilters(tx({ feeCharged: "not-a-number" }), filters)).toBe(false);
  });

  it("returns the same array when nothing is filtered", () => {
    const txs = [tx()];
    expect(applyFilters(txs, EMPTY_FILTERS)).toBe(txs);
  });

  it("round-trips through the short query-string keys already in use", () => {
    // The parameter names are the compatibility surface: these URLs are in
    // bookmarks, so `minOps` cannot become `minOperations`.
    const filters: TransactionFilters = {
      status: "failed",
      fromDate: "2026-01-01",
      toDate: "2026-02-01",
      source: "GABC",
      minOperations: 3,
      maxFeeXlm: 0.5,
    };
    const query = filtersToQueryString(filters);
    expect(query).toContain("minOps=3");
    expect(query).toContain("maxFee=0.5");
    expect(query).toContain("from=2026-01-01");
    expect(filtersFromQueryString(query)).toEqual(filters);
  });

  it("falls back to the default for an unusable value instead of throwing", () => {
    expect(
      filtersFromQueryString("status=nonsense&from=yesterday&minOps=-4"),
    ).toEqual(EMPTY_FILTERS);
  });
});

describe("operationFilters", () => {
  it("defaults to payments only, not to everything", () => {
    // The issue this exists for: a default that alerts on every operation makes
    // a watch of a busy address something people turn off.
    expect(DEFAULT_OPERATION_FILTERS.operationType).toBe("PAYMENT");
    expect(isEmptyOperationFilters(DEFAULT_OPERATION_FILTERS)).toBe(false);
    expect(matchesOperationFilters(op({ type: "PAYMENT" }), DEFAULT_OPERATION_FILTERS)).toBe(true);
    expect(
      matchesOperationFilters(op({ type: "SET_OPTIONS" }), DEFAULT_OPERATION_FILTERS),
    ).toBe(false);
  });

  it("treats the empty filter as matching every operation", () => {
    expect(isEmptyOperationFilters(EMPTY_OPERATION_FILTERS)).toBe(true);
    for (const type of OPERATION_TYPE_FILTERS) {
      if (type === "all") continue;
      expect(
        matchesOperationFilters(op({ type }), EMPTY_OPERATION_FILTERS),
      ).toBe(true);
    }
  });

  it("counts the fields that are set", () => {
    expect(countActiveOperationFilters(EMPTY_OPERATION_FILTERS)).toBe(0);
    expect(
      countActiveOperationFilters({ ...EMPTY_OPERATION_FILTERS, minAmount: 0 }),
    ).toBe(1);
    expect(
      countActiveOperationFilters({
        ...EMPTY_OPERATION_FILTERS,
        minAmount: 10,
        asset: "usd",
      }),
    ).toBe(2);
  });

  it("treats a minimum amount of zero as a real bound, not as unset", () => {
    // Zero is the number most likely to be confused with "no bound", so it has
    // its own test rather than being folded into the general case.
    const filters = { ...EMPTY_OPERATION_FILTERS, minAmount: 0 };
    expect(countActiveOperationFilters(filters)).toBe(1);
    expect(matchesOperationFilters(op({ amount: "0" }), filters)).toBe(true);
    expect(isEmptyOperationFilters(filters)).toBe(false);
  });

  it("excludes an operation with no amount once a minimum is set", () => {
    // A `setOptions` has no amount, so "at least 1" is a claim it cannot
    // satisfy. Passing it would alert on exactly the housekeeping operations a
    // minimum was set to exclude.
    const filters = { ...EMPTY_OPERATION_FILTERS, minAmount: 1 };
    expect(matchesOperationFilters(op({ type: "SET_OPTIONS", amount: null }), filters)).toBe(false);
    expect(matchesOperationFilters(op({ amount: "0.5" }), filters)).toBe(false);
    expect(matchesOperationFilters(op({ amount: "1" }), filters)).toBe(true);
  });

  it("matches XLM through the asset filter, because native XLM has a null asset", () => {
    expect(operationAsset(op({ asset: null }))).toBe("XLM");
    const filters = { ...EMPTY_OPERATION_FILTERS, asset: "xlm" };
    expect(matchesOperationFilters(op({ asset: null }), filters)).toBe(true);
    expect(matchesOperationFilters(op({ asset: "USDC" }), filters)).toBe(false);
  });

  it("round-trips through the query string", () => {
    const filters: OperationFilters = {
      operationType: "ACCOUNT_MERGE",
      minAmount: 12.5,
      asset: "USDC",
    };
    expect(operationFiltersFromQueryString(operationFiltersToQueryString(filters))).toEqual(
      filters,
    );
  });

  it("reads a URL with no parameters as the default, not the empty filter", () => {
    expect(operationFiltersFromQueryString("")).toEqual(DEFAULT_OPERATION_FILTERS);
  });

  it("rejects an operation type the enum does not contain", () => {
    // Otherwise a hand-edited URL produces a filter that matches nothing, which
    // looks like a broken feature rather than a bad URL.
    expect(operationFiltersFromQueryString("type=NOT_A_TYPE")).toEqual(
      DEFAULT_OPERATION_FILTERS,
    );
  });

  it("treats an empty parameter as removing the filter", () => {
    expect(operationFiltersFromQueryString("type=&asset=")).toEqual(
      DEFAULT_OPERATION_FILTERS,
    );
  });

  it("returns the same array when nothing is filtered", () => {
    const operations = [op()];
    expect(applyOperationFilters(operations, EMPTY_OPERATION_FILTERS)).toBe(operations);
    expect(applyOperationFilters(operations, { ...EMPTY_OPERATION_FILTERS, minAmount: 1000 })).toEqual([]);
  });
});

describe("normaliseOperationFilters", () => {
  it("gives a watch with no stored filter the default", () => {
    expect(normaliseOperationFilters(undefined)).toEqual(DEFAULT_OPERATION_FILTERS);
    expect(normaliseOperationFilters(null)).toEqual(DEFAULT_OPERATION_FILTERS);
    expect(normaliseOperationFilters("nope")).toEqual(DEFAULT_OPERATION_FILTERS);
  });

  it("repairs a partially valid stored filter field by field", () => {
    expect(
      normaliseOperationFilters({
        operationType: "NOT_A_TYPE",
        minAmount: -5,
        asset: "  USDC  ",
      }),
    ).toEqual({ operationType: "PAYMENT", minAmount: null, asset: "USDC" });
  });

  it("keeps a valid stored filter intact", () => {
    const stored = { operationType: "all", minAmount: 3, asset: "usd" };
    expect(normaliseOperationFilters(stored)).toEqual(stored);
  });
});
