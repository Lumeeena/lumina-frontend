/**
 * The filter model both filter families are built from.
 *
 * There are two kinds of filter in Lumina — over transactions
 * (`lib/transactionFilters.ts`) and over operations (`lib/operationFilters.ts`)
 * — and the second exists only because watches need to decide what is worth
 * alerting on. When each family kept its own `countActiveFilters`, its own
 * query-string writer and its own "is this a usable number" validator, they
 * drifted within a release: a preset saved on the transactions page would drop
 * a field the watch page considered valid.
 *
 * So a filter family describes each of its fields once, here, and everything
 * else — counting, matching, serialising, parsing — is derived. Adding a field
 * to a family is a single entry rather than four edits that can disagree.
 *
 * Deliberately free of React and of any global, so it is importable from a
 * server component and testable in plain Node.
 */

/** The set of scalar types a filter field can hold. */
export type FilterValue = string | number | null;

/** A filter object whose declared fields use the scalar values above. */
export type FilterShape = object;

export interface FilterField<R> {
  /** Query-string parameter name. */
  key: string;
  /**
   * The property name on the filter object.
   *
   * Defaults to `key`. It exists because the two should not have to be the
   * same: the transactions filter has been writing `?minOps=` and `?from=` for
   * longer than these fields have been called `minOperations` and `fromDate`,
   * and those URLs are in bookmarks. The short name is the compatibility
   * surface; the long name is what the code reads like.
   */
  field?: string;
  /** The value that means "not filtering by this field". */
  default: FilterValue;
  /**
   * True when `value` is indistinguishable from the default.
   *
   * Separate from `value === default` because the interesting cases are the
   * ones where they differ: an empty text box is a blank filter, and `"0"` is a
   * real minimum.
   */
  isDefault(value: FilterValue): boolean;
  /**
   * Coerce an untrusted query-string value.
   *
   * **Must return `default` for anything unusable** — that is the contract
   * `filtersFromQueryString` relies on, because an unusable value means "the
   * author did not set a usable filter", which is the default rather than a
   * neighbouring field's idea of "off". A filter family whose parse falls back
   * to some other value will quietly widen a filter on a bad URL.
   */
  parse(raw: string | null): FilterValue;
  /** Render a value for the query string. Only called for non-defaults. */
  serialise(value: FilterValue): string;
  /** Whether `record` survives this field's constraint. */
  matches(value: FilterValue, record: R): boolean;
}

export type FilterSpec<R> = readonly FilterField<R>[];

/** The property name a field is stored under on the filter object. */
export function fieldName(field: FilterField<unknown>): string {
  return field.field ?? field.key;
}

export function countActiveFilters<R, F extends FilterShape>(
  filters: F,
  spec: FilterSpec<R>,
): number {
  let active = 0;
  for (const field of spec) {
    const values = filters as Record<string, FilterValue>;
    if (!field.isDefault(values[fieldName(field)] ?? field.default)) active++;
  }
  return active;
}

export function isEmptyFilters<R, F extends FilterShape>(
  filters: F,
  spec: FilterSpec<R>,
): boolean {
  return countActiveFilters(filters, spec) === 0;
}

/** Every field has to accept the record; the spec order is the check order. */
export function matchesFilters<R, F extends FilterShape>(
  record: R,
  filters: F,
  spec: FilterSpec<R>,
): boolean {
  for (const field of spec) {
    const value = (filters as Record<string, FilterValue>)[fieldName(field)] ?? field.default;
    if (!field.matches(value, record)) return false;
  }
  return true;
}

/**
 * Only non-default values are written, so an unfiltered view has a clean URL
 * and a shared link carries exactly the filters someone actually set.
 */
export function filtersToQueryString<R, F extends FilterShape>(
  filters: F,
  spec: FilterSpec<R>,
): string {
  const params = new URLSearchParams();
  for (const field of spec) {
    const value = (filters as Record<string, FilterValue>)[fieldName(field)] ?? field.default;
    if (field.isDefault(value)) continue;
    params.set(field.key, field.serialise(value));
  }
  return params.toString();
}

/**
 * Read a whole filter object back out of a query string.
 *
 * Unknown parameters are ignored and unusable ones fall back to their default,
 * so a URL written by a newer or older build still renders.
 */
export function filtersFromQueryString<F extends FilterShape>(
  query: string | URLSearchParams,
  spec: FilterSpec<unknown>,
  defaults: F,
): F {
  const params = typeof query === "string" ? new URLSearchParams(query) : query;
  const result: Record<string, FilterValue> = { ...defaults } as Record<string, FilterValue>;
  for (const field of spec) {
    if (!params.has(field.key)) continue;
    const raw = params.get(field.key);
    // An empty value means the author removed the filter, not that the filter
    // is the empty string — `?asset=` should behave like `?source=`.
    if (raw === null || raw.trim() === "") continue;
    result[fieldName(field)] = field.parse(raw);
  }
  return result as F;
}

// ─── Shared field parsers ────────────────────────────────────────────────────
//
// These exist because the same three shapes of validation keep coming up, and
// each family getting its own copy is how "0 is a valid minimum" and "0 is
// garbage" end up meaning different things in two places.

/** An inclusive `YYYY-MM-DD` day, or null. */
export function normaliseDate(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/** A finite number at or above zero, or null. Zero is a real bound. */
export function positiveNumberOrNull(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** A whole number at or above zero, or null. */
export function positiveIntOrNull(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

/** A trimmed non-empty string, or null — so a blank box is never a filter. */
export function textOrNull(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Restrict a value to a fixed set, falling back to `fallback`.
 *
 * The reason this lives in the model rather than in each family: a filter
 * driven by an enum has to reject values the enum does not contain, or a
 * hand-edited URL silently produces a filter that matches nothing.
 */
export function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** A field that filters by a case-insensitive substring of a string. */
export function substringField<R>(
  key: string,
  read: (record: R) => string | null | undefined,
): FilterField<R> {
  return {
    key,
    default: "",
    isDefault: (value) => typeof value !== "string" || value.trim() === "",
    parse: (raw) => textOrNull(raw) ?? "",
    serialise: (value) => String(value).trim(),
    matches: (value, record) => {
      const needle = String(value).trim().toLowerCase();
      if (!needle) return true;
      return (read(record) ?? "").toLowerCase().includes(needle);
    },
  };
}

/** A field that filters by a numeric lower bound, compared with `read`. */
export function minNumberField<R>(
  key: string,
  read: (record: R) => number | null,
): FilterField<R> {
  return {
    key,
    default: null,
    isDefault: (value) => value === null || value === undefined,
    parse: positiveNumberOrNull,
    serialise: (value) => String(value),
    matches: (value, record) => {
      if (value === null || value === undefined) return true;
      const bound = Number(value);
      if (!Number.isFinite(bound)) return true;
      const actual = read(record);
      // A record with no numeric value cannot satisfy "at least N" — the bound
      // is a claim about a quantity the record does not have, so it excludes
      // rather than passes.
      if (actual === null || !Number.isFinite(actual)) return false;
      return actual >= bound;
    },
  };
}
