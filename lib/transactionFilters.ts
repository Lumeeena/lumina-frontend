import type { Transaction } from "./types";

/**
 * Filters over the fields a `Transaction` actually carries.
 *
 * Operation type, amount and asset deliberately are not here. They are fields
 * of `Operation`, not `Transaction`, and the GraphQL `transactions` query
 * returns neither — filtering on them needs the backend's search work, so this
 * degrades to the client-visible fields rather than pretending.
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

export function isEmptyFilters(filters: TransactionFilters): boolean {
  return countActiveFilters(filters) === 0;
}

export function countActiveFilters(filters: TransactionFilters): number {
  let active = 0;
  if (filters.status !== "all") active++;
  if (filters.fromDate) active++;
  if (filters.toDate) active++;
  if (filters.source.trim()) active++;
  if (filters.minOperations !== null) active++;
  if (filters.maxFeeXlm !== null) active++;
  return active;
}

export function matchesFilters(tx: Transaction, filters: TransactionFilters): boolean {
  if (filters.status === "successful" && !tx.successful) return false;
  if (filters.status === "failed" && tx.successful) return false;

  if (filters.fromDate || filters.toDate) {
    // Compare on the date portion so a day boundary behaves the way someone
    // picking "1 March to 1 March" expects: that whole day, inclusive.
    const day = tx.createdAt.slice(0, 10);
    if (filters.fromDate && day < filters.fromDate) return false;
    if (filters.toDate && day > filters.toDate) return false;
  }

  const source = filters.source.trim().toLowerCase();
  if (source && !tx.sourceAccount.toLowerCase().includes(source)) return false;

  if (filters.minOperations !== null && tx.operationCount < filters.minOperations) return false;

  if (filters.maxFeeXlm !== null) {
    const feeXlm = Number(tx.feeCharged) / STROOPS_PER_XLM;
    if (!Number.isFinite(feeXlm) || feeXlm > filters.maxFeeXlm) return false;
  }

  return true;
}

export function applyFilters(txs: Transaction[], filters: TransactionFilters): Transaction[] {
  if (isEmptyFilters(filters)) return txs;
  return txs.filter(tx => matchesFilters(tx, filters));
}

// ─── URL serialisation ───────────────────────────────────────────────────────
//
// Only non-default values are written, so an unfiltered view has a clean URL
// and a shared link carries exactly the filters someone actually set.

export function filtersToQueryString(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.fromDate) params.set("from", filters.fromDate);
  if (filters.toDate) params.set("to", filters.toDate);
  if (filters.source.trim()) params.set("source", filters.source.trim());
  if (filters.minOperations !== null) params.set("minOps", String(filters.minOperations));
  if (filters.maxFeeXlm !== null) params.set("maxFee", String(filters.maxFeeXlm));
  return params.toString();
}

/** Anything unparseable falls back to that field's default rather than erroring. */
export function filtersFromQueryString(query: string | URLSearchParams): TransactionFilters {
  const params = typeof query === "string" ? new URLSearchParams(query) : query;

  const status = params.get("status");
  const source = params.get("source");

  return {
    status: status === "successful" || status === "failed" ? status : "all",
    fromDate: normaliseDate(params.get("from")),
    toDate: normaliseDate(params.get("to")),
    source: source ?? "",
    minOperations: positiveIntOrNull(params.get("minOps")),
    maxFeeXlm: positiveNumberOrNull(params.get("maxFee")),
  };
}

function normaliseDate(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function positiveIntOrNull(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function positiveNumberOrNull(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
