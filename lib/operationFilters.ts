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

/**
 * Operation types accepted by the watch type filter, with `all` as its
 * unfiltered choice. Use this list to populate type controls and validate
 * values loaded from URLs or storage.
 */
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
 * Use this helper wherever an operation's asset code is compared or displayed
 * as part of watch filtering; non-null asset values pass through unchanged.
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
      oneOf(
        raw,
        OPERATION_TYPE_FILTERS,
        DEFAULT_OPERATION_FILTERS.operationType,
      ),
    serialise: (value) => String(value),
    matches: (value, operation) =>
      value === "all" ||
      value === null ||
      value === undefined ||
      operation.type === value,
  },
  minNumberField("minAmount", (operation) => {
    if (operation.amount === null || operation.amount === undefined)
      return null;
    const amount = Number(operation.amount);
    return Number.isFinite(amount) ? amount : null;
  }),
  substringField("asset", operationAsset),
];

/**
 * Count active type, minimum-amount and asset constraints for a watch settings
 * indicator. `all`, a missing amount bound and a blank asset are inactive;
 * `PAYMENT` is active even though it is the watch default, and a zero amount
 * is an active bound.
 *
 * @param filters Watch operation filters to inspect.
 * @returns The number of active constraints, from zero to three.
 */
export function countActiveOperationFilters(filters: OperationFilters): number {
  return countActiveFilters(filters, OPERATION_FILTER_SPEC);
}

/**
 * Check whether no operation constraints are active. Use this to identify an
 * unfiltered watch; the payment-only default is not empty, while `all` with no
 * amount or asset constraint is.
 *
 * @param filters Watch operation filters to inspect.
 * @returns `true` when every field is at its unfiltered value.
 */
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

/**
 * Apply watch filters to an operation list. Use this to show only matching
 * activity; when filters are empty it returns the original array unchanged,
 * otherwise it returns a filtered array. An amount bound excludes operations
 * that have no valid numeric amount.
 *
 * @param operations Operations to filter.
 * @param filters Watch operation filters to apply.
 * @returns The original list for empty filters, or a new list of matches.
 */
export function applyOperationFilters(
  operations: Operation[],
  filters: OperationFilters,
): Operation[] {
  if (isEmptyOperationFilters(filters)) return operations;
  return operations.filter((operation) =>
    matchesOperationFilters(operation, filters),
  );
}

/**
 * Serialize watch filters into a shareable URL query string. Only active fields
 * are emitted; the `PAYMENT` default is included, while `all`, a missing amount
 * and a blank asset are omitted. Zero is serialized as a real minimum.
 *
 * @param filters Watch operation filters to serialize.
 * @returns Query-string parameters without a leading `?`.
 */
export function operationFiltersToQueryString(
  filters: OperationFilters,
): string {
  return filtersToQueryString(filters, OPERATION_FILTER_SPEC);
}

/**
 * Parse watch filters from a query string or `URLSearchParams`. Missing and
 * blank parameters use the watch defaults; unknown parameters are ignored, and
 * invalid type or amount values fall back to `PAYMENT` or no amount bound
 * rather than throwing. Use this to restore shareable watch-filter URLs.
 *
 * @param query Query-string text or already parsed search parameters.
 * @returns A complete filter object, defaulting to payment-only filtering.
 */
export function operationFiltersFromQueryString(
  query: string | URLSearchParams,
): OperationFilters {
  return filtersFromQueryString(
    query,
    OPERATION_FILTER_SPEC,
    DEFAULT_OPERATION_FILTERS,
  );
}
/**
 * Coerce an untrusted value, such as persisted watch data, into valid filters.
 *
 * Storage is writable by hand and survived a schema change, so a watch saved by
 * an older build can be missing fields or carrying a value the enum does not
 * contain. Filling each field from the default keeps one bad watch from
 * rendering the whole list unfilterable. Non-object input returns a fresh copy
 * of the payment-only default. For objects, invalid fields are repaired
 * independently: invalid types become `PAYMENT`, invalid/negative/non-finite
 * amounts become `null`, and non-string assets become empty strings; valid
 * asset strings are trimmed.
 *
 * @param value Untrusted filter data from storage or another external source.
 * @returns A complete, normalized watch filter object.
 */
export function normaliseOperationFilters(value: unknown): OperationFilters {
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
