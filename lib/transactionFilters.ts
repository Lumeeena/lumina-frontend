import type { Transaction } from "./types";
import {
  countActiveFilters as countFields,
  fieldName,
  filtersFromQueryString as specFromQueryString,
  filtersToQueryString as specToQueryString,
  isEmptyFilters as specIsEmpty,
  matchesFilters as specMatches,
  normaliseDate,
  positiveIntOrNull,
  positiveNumberOrNull,
  substringField,
  type FilterField,
  type FilterSpec,
} from "./filterModel";

/**
 * Filters over the fields a `Transaction` actually carries.
 *
 * Operation type, amount and asset deliberately are not here. They are fields
 * of `Operation`, not `Transaction`, and the GraphQL `transactions` query
 * returns neither — filtering on them needs the backend's search work, so this
 * degrades to the client-visible fields rather than pretending. Operations are
 * filtered by `lib/operationFilters.ts`, which shares this file's model.
 */
export interface TransactionFilters {
  status: "all" | "successful" | "failed";
  /** Inclusive ISO date (`YYYY-MM-DD`), compared against `createdAt`. */
  fromDate: string | null;
  toDate: string | null;
  /** Case-insensitive substring of the source account. */
  source: string;
  minOperations: number | null;
  /** Maximum fee in XLM, compared against `feeCharged` (stroops). */
  maxFeeXlm: number | null;
}

export const EMPTY_FILTERS: TransactionFilters = {
  status: "all",
  fromDate: null,
  toDate: null,
  source: "",
  minOperations: null,
  maxFeeXlm: null,
};

const STROOPS_PER_XLM = 1e7;

/** Inclusive on both ends, compared on the date portion only. */
function dayField(
  key: string,
  field: string,
  bound: "from" | "to",
): FilterField<Transaction> {
  return {
    key,
    field,
    default: null,
    isDefault: (value) => value === null || value === undefined,
    parse: normaliseDate,
    serialise: (value) => String(value),
    matches: (value, tx) => {
      if (value === null || value === undefined) return true;
      // Compare on the date portion so a day boundary behaves the way someone
      // picking "1 March to 1 March" expects: that whole day, inclusive.
      const day = tx.createdAt.slice(0, 10);
      return bound === "from" ? day >= String(value) : day <= String(value);
    },
  };
}

const TRANSACTION_FILTER_SPEC: FilterSpec<Transaction> = [
  {
    key: "status",
    default: "all",
    isDefault: (value) =>
      value === "all" || value === null || value === undefined,
    parse: (raw) => (raw === "successful" || raw === "failed" ? raw : "all"),
    serialise: (value) => String(value),
    matches: (value, tx) => {
      if (value === "successful") return tx.successful;
      if (value === "failed") return !tx.successful;
      return true;
    },
  },
  dayField("from", "fromDate", "from"),
  dayField("to", "toDate", "to"),
  substringField("source", (tx) => tx.sourceAccount),
  {
    key: "minOps",
    field: "minOperations",
    default: null,
    isDefault: (value) => value === null || value === undefined,
    parse: positiveIntOrNull,
    serialise: (value) => String(value),
    matches: (value, tx) =>
      value === null || value === undefined
        ? true
        : tx.operationCount >= Number(value),
  },
  {
    key: "maxFee",
    field: "maxFeeXlm",
    default: null,
    isDefault: (value) => value === null || value === undefined,
    parse: positiveNumberOrNull,
    serialise: (value) => String(value),
    matches: (value, tx) => {
      if (value === null || value === undefined) return true;
      const feeXlm = Number(tx.feeCharged) / STROOPS_PER_XLM;
      // A fee that is not a number cannot be shown to be within the bound, so
      // it is excluded rather than passing an unverified comparison.
      if (!Number.isFinite(feeXlm)) return false;
      return feeXlm <= Number(value);
    },
  },
];

export function isEmptyFilters(filters: TransactionFilters): boolean {
  return specIsEmpty(filters, TRANSACTION_FILTER_SPEC);
}

/** How many fields are set — the "(2)" in "2 filters active". */
export function countActiveFilters(filters: TransactionFilters): number {
  return countFields(filters, TRANSACTION_FILTER_SPEC);
}

export function matchesFilters(
  tx: Transaction,
  filters: TransactionFilters,
): boolean {
  return specMatches(tx, filters, TRANSACTION_FILTER_SPEC);
}

export function applyFilters(
  txs: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  if (isEmptyFilters(filters)) return txs;
  return txs.filter((tx) => matchesFilters(tx, filters));
}

// ─── URL serialisation ───────────────────────────────────────────────────────
//
// Only non-default values are written, so an unfiltered view has a clean URL
// and a shared link carries exactly the filters someone actually set. The
// parameter names are the short ones the existing URLs already use; the
// implementation is shared with `lib/operationFilters.ts` — see
// `lib/filterModel.ts`.

export function filtersToQueryString(filters: TransactionFilters): string {
  return specToQueryString(filters, TRANSACTION_FILTER_SPEC);
}

/** Anything unparseable falls back to that field's default rather than erroring. */
export function filtersFromQueryString(
  query: string | URLSearchParams,
): TransactionFilters {
  return specFromQueryString(query, TRANSACTION_FILTER_SPEC, EMPTY_FILTERS);
}

export { TRANSACTION_FILTER_SPEC, fieldName };
