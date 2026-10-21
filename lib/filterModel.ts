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

/**
 * Definition of a single filter field.
 *
 * Each field declares how to parse from query strings, whether a value is
 * considered the default ("off"), how to serialise back, and how to test
 * membership against a record. The spec is data-driven so both transaction
 * and operation filters share the same logic.
 *
 * @typeParam R - The record type being filtered (arbitrary object).
 */
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
   *
   * @param value - Current value for the field.
   * @returns `true` if the value means "no filter"/default.
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
   *
   * @param raw - Raw string from query string, or `null`.
   * @returns Parsed value, or `default` if unusable.
   */
  parse(raw: string | null): FilterValue;
  /**
   * Render a value for the query string. Only called for non-defaults.
   *
   * @param value - Non-default value to serialise.
   * @returns String representation for query string.
   */
  serialise(value: FilterValue): string;
  /**
   * Whether `record` survives this field's constraint.
   *
   * @param value - Current filter value for the field.
   * @param record - Record being tested.
   * @returns `true` if the record matches this field's filter.
   */
  matches(value: FilterValue, record: R): boolean;
}

/**
 * Ordered list of field definitions for a filter family.
 *
 * @typeParam R - Record type being filtered.
 */
export type FilterSpec<R> = readonly FilterField<R>[];

/**
 * The property name a field is stored under on the filter object.
 *
 * Uses {@link FilterField.field} if present, otherwise falls back to
 * {@link FilterField.key} for backwards compatibility with existing URLs/code.
 *
 * @param field - Field definition.
 * @returns Property name to read/write on filter objects.
 */
export function fieldName(field: FilterField<unknown>): string {
  return field.field ?? field.key;
}

/**
 * Count how many filters are actively set (non-default).
 *
 * @typeParam R - Record type (not directly used except via spec).
 * @typeParam F - Filter shape object.
 * @param filters - Current filter values.
 * @param spec - Filter specification.
 * @returns Number of fields with non-default values.
 */
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

/**
 * Check if all filters are at defaults (no active filters).
 *
 * @typeParam R - Record type.
 * @typeParam F - Filter shape object.
 * @param filters - Current filter values.
 * @param spec - Filter specification.
 * @returns `true` if no filters are active.
 */
export function isEmptyFilters<R, F extends FilterShape>(
  filters: F,
  spec: FilterSpec<R>,
): boolean {
  return countActiveFilters(filters, spec) === 0;
}

/**
 * Test whether a record matches all filters in the spec.
 *
 * Every field must accept the record; the spec order is the check order (early
 * return on first failure). Missing values fall back to each field's default.
 *
 * @typeParam R - Record type being tested.
 * @typeParam F - Filter shape object.
 * @param record - Record to test.
 * @param filters - Current filter values.
 * @param spec - Filter specification.
 * @returns `true` if the record passes all filters.
 */
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
 * Serialize filters to a query string.
 *
 * Only non-default values are written, so an unfiltered view has a clean URL
 * and a shared link carries exactly the filters someone actually set.
 *
 * @typeParam R - Record type.
 * @typeParam F - Filter shape object.
 * @param filters - Current filter values.
 * @param spec - Filter specification.
 * @returns URL query string (without leading `?`).
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
 * so a URL written by a newer or older build still renders. Empty/whitespace
 * values are treated as removal (not as the empty string filter). Starts from
 * `defaults` and overlays parsed values for present keys.
 *
 * @typeParam F - Filter shape object.
 * @param query - Query string or `URLSearchParams`.
 * @param spec - Filter specification (used to know keys/parsers).
 * @param defaults - Default filter values to start from.
 * @returns Hydrated filter object.
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

/**
 * Normalize a string to an inclusive `YYYY-MM-DD` day, or `null`.
 *
 * Only the exact pattern `YYYY-MM-DD` is accepted (digits, dashes). No range
 * validation is performed here — callers may validate semantics separately.
 *
 * @param value - Raw string to normalize.
 * @returns The value if it matches `YYYY-MM-DD`, otherwise `null`.
 */
export function normaliseDate(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/**
 * Parse a non-negative finite number, or `null`.
 *
 * Empty/whitespace strings return `null`. Zero is considered a real bound
 * (allowed). Non-finite or negative values return `null`.
 *
 * @param value - Raw string to parse.
 * @returns Parsed number >= 0, or `null` if unusable.
 */
export function positiveNumberOrNull(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Parse a non-negative integer, or `null`.
 *
 * Empty/whitespace strings return `null`. Zero is considered a real bound
 * (allowed). Non-integers or negative values return `null`.
 *
 * @param value - Raw string to parse.
 * @returns Parsed integer >= 0, or `null` if unusable.
 */
export function positiveIntOrNull(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Trim to a non-empty string, or `null`.
 *
 * Used so a blank input box is never treated as a filter value.
 *
 * @param value - Raw string to trim.
 * @returns Trimmed string if non-empty, otherwise `null`.
 */
export function textOrNull(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Restrict a value to a fixed set, falling back to `fallback`.
 *
 * The reason this lives in the model rather than in each family: a filter
 * driven by an enum has to reject values the enum does not contain, or a
 * hand-edited URL silently produces a filter that matches nothing. Case is
 * not normalized here; callers should normalize before passing if needed.
 *
 * @typeParam T - Union of allowed string literals.
 * @param value - Raw string from query/selector.
 * @param allowed - Allowed values.
 * @param fallback - Value to return if `value` is not in `allowed`.
 * @returns `value` as `T` if valid and allowed, else `fallback`.
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

/**
 * Create a case-insensitive substring filter field.
 *
 * Default is `""` (no filter). Parsing treats blank as `""` via
 * {@link textOrNull} falling back to empty string. Matching does
 * case-insensitive `includes()` against `read(record) ?? ""`. If the needle
 * is empty/whitespace-only, it matches all records.
 *
 * @typeParam R - Record type.
 * @param key - Query parameter key.
 * @param read - Extract the string to search from a record.
 * @returns A configured {@link FilterField}.
 */
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

/**
 * Create a numeric lower-bound filter field.
 *
 * Default is `null` (no filter). Values are parsed with
 * {@link positiveNumberOrNull} (zero allowed). Matching requires the record
 * to have a finite numeric value `actual >= bound`. If the record has no
 * numeric value or `actual` is not finite, the filter excludes the record
 * (a lower bound on a missing quantity cannot be satisfied).
 *
 * @typeParam R - Record type.
 * @param key - Query parameter key.
 * @param read - Extract the numeric value from a record (or `null` if missing).
 * @returns A configured {@link FilterField}.
 */
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
