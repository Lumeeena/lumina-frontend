import type { Operation } from "./types";
import {
  countActiveFilters,
  filtersFromQueryString,
  filtersToQueryString,
  isEmptyFilters as specIsEmpty,
  matchesFilters as specMatches,
  oneOf,
  substringField,
  minNumberField,
  type FilterSpec,
} from "./filterModel";

/**
 * What a watch should alert on. Part of #83.
 *
 * This is the second filter family in the app, and it is built on
 * `lib/filterModel.ts` rather than as a parallel implementation — the counting,
 * the query-string round trip and the "is this a usable number" validation all
 * come from the same place as `lib/transactionFilters.ts`, so a value that
 * means something on the transactions page means the same thing here.
 *
 * Deliberately free of React, so it is importable from a server component and
 * testable in plain Node.
 */
export interface OperationFilters {
  /** `"all"` disables the type filter; otherwise an exact operation type. */
  operationType: Operation["type"] | "all";
  /** Smallest amount worth alerting on. `null` means no lower bound. */
  minAmount: number | null;
  /** Case-insensitive substring of the asset code. `""` means any asset. */
  asset: string;
}

/**
 * The filter a watch starts with.
 *
 * Not "everything", on purpose: an exchange or a mint address produces
 * operations continuously, and a watch that alerts on all of them is a watch
 * someone turns off within an hour. A payment is the operation people watch an
 * address *for* — it is the one that moves their balance — so that is the only
 * thing a new watch alerts on until someone widens it.
 *
 * Offered operations, trust changes and path payments stay silent by default
 * because they are either routine housekeeping or a rounding artefact of a
 * larger transfer.
 */
export const DEFAULT_OPERATION_FILTERS: OperationFilters = {
  operationType: "PAYMENT",
  minAmount: null,
  asset: "",
};

/** The widest filter: matches every operation. Reachable, but not the default. */
export const EMPTY_OPERATION_FILTERS: OperationFilters = {
  operationType: "all",
  minAmount: null,
  asset: "",
};

export const OPERATION_TYPE_FILTERS: readonly (Operation["type"] | "all")[] = [
  "all",
  "PAYMENT",
  "CREATE_ACCOUNT",
  "PATH_PAYMENT_STRICT_SEND",
  "PATH_PAYMENT_STRICT_RECEIVE",
  "MANAGE_SELL_OFFER",
  "MANAGE_BUY_OFFER",
  "CREATE_PASSIVE_SELL_OFFER",
  "SET_OPTIONS",
  "CHANGE_TRUST",
  "ALLOW_TRUST",
  "ACCOUNT_MERGE",
  "MANAGE_DATA",
  "BUMP_SEQUENCE",
  "INVOKE_HOST_FUNCTION",
  "EXTEND_FOOTPRINT_TTL",
  "RESTORE_FOOTPRINT",
];

/**
 * Native XLM arrives with a null asset, so a filter that only ever read
 * `operation.asset` could never match the currency most people are watching for.
 */
export function operationAsset(operation: Operation): string {
  return operation.asset ?? "XLM";
}

const OPERATION_FILTER_SPEC: FilterSpec<Operation> = [
  {
    key: "type",
    field: "operationType",
    default: DEFAULT_OPERATION_FILTERS.operationType,
    isDefault: (value) =>
      value === "all" || value === null || value === undefined,
    // The fallback has to be this field's own default, not "all": an unusable
    // value means "the author did not set a usable filter", which for a watch is
    // the payment default. Falling back to "all" here would turn a typo into an
    // alert on every operation, which is the opposite of what the default is for.
    parse: (raw) =>
      oneOf(raw, OPERATION_TYPE_FILTERS, DEFAULT_OPERATION_FILTERS.operationType),
    serialise: (value) => String(value),
    matches: (value, operation) =>
      value === "all" ||
      value === null ||
      value === undefined ||
      operation.type === value,
  },
  minNumberField("minAmount", (operation) => {
    if (operation.amount === null || operation.amount === undefined) return null;
    const amount = Number(operation.amount);
    return Number.isFinite(amount) ? amount : null;
  }),
  substringField("asset", operationAsset),
];

/** How many of the three fields are set — the "(2)" in "2 filters active". */
export function countActiveOperationFilters(filters: OperationFilters): number {
  return countActiveFilters(filters, OPERATION_FILTER_SPEC);
}

export function isEmptyOperationFilters(filters: OperationFilters): boolean {
  return specIsEmpty(filters, OPERATION_FILTER_SPEC);
}

/**
 * Whether an operation is worth alerting on under these filters.
 *
 * The amount rule has one sharp edge worth stating: an operation with no
 * amount — a `setOptions`, a `manageData` — cannot satisfy "at least N", so
 * setting a minimum amount also silences every operation that has no amount.
 * That is the honest reading of the filter, and the alternative (treat a
 * missing amount as zero, then let it through) would alert on exactly the
 * housekeeping operations a minimum was set to exclude.
 */
export function matchesOperationFilters(
  operation: Operation,
  filters: OperationFilters,
): boolean {
  return specMatches(operation, filters, OPERATION_FILTER_SPEC);
}

export function applyOperationFilters(
  operations: Operation[],
  filters: OperationFilters,
): Operation[] {
  if (isEmptyOperationFilters(filters)) return operations;
  return operations.filter((operation) => matchesOperationFilters(operation, filters));
}

export function operationFiltersToQueryString(filters: OperationFilters): string {
  return filtersToQueryString(filters, OPERATION_FILTER_SPEC);
}

export function operationFiltersFromQueryString(
  query: string | URLSearchParams,
): OperationFilters {
  return filtersFromQueryString(query, OPERATION_FILTER_SPEC, DEFAULT_OPERATION_FILTERS);
}
/**
 * Coerce anything read out of storage into a valid filter.
 *
 * Storage is writable by hand and survived a schema change, so a watch saved by
 * an older build can be missing fields or carrying a value the enum does not
 * contain. Filling each field from the default keeps one bad watch from
 * rendering the whole list unfilterable.
 */
export function normaliseOperationFilters(
  value: unknown,
): OperationFilters {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_OPERATION_FILTERS };
  }
  const raw = value as Record<string, unknown>;
  const type = raw.operationType;
  const amount = raw.minAmount;
  const asset = raw.asset;
  return {
    operationType:
      typeof type === "string" &&
      (OPERATION_TYPE_FILTERS as readonly string[]).includes(type)
        ? (type as Operation["type"] | "all")
        : DEFAULT_OPERATION_FILTERS.operationType,
    minAmount:
      typeof amount === "number" && Number.isFinite(amount) && amount >= 0
        ? amount
        : null,
    asset: typeof asset === "string" ? asset.trim() : "",
  };
}
