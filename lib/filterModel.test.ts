import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  isEmptyFilters,
  matchesFilters,
  filtersToQueryString,
  filtersFromQueryString,
  normaliseDate,
  positiveNumberOrNull,
  positiveIntOrNull,
  textOrNull,
  oneOf,
  substringField,
  minNumberField,
  type FilterField,
  type FilterSpec,
} from "./filterModel";

// Test record type and filter type for examples
interface TestRecord {
  name: string;
  value: number;
  date?: string;
}

interface TestFilters {
  name: string;
  minValue: number | null;
  date: string | null;
}

const testSpec: FilterSpec<TestRecord> = [
  {
    key: "name",
    default: "",
    isDefault: (value) => typeof value !== "string" || value.trim() === "",
    parse: (raw) => textOrNull(raw) ?? "",
    serialise: (value) => String(value),
    matches: (value, record) => {
      if (typeof value !== "string" || !value.trim()) return true;
      return record.name.toLowerCase().includes(String(value).toLowerCase());
    },
  },
  {
    key: "minVal",
    field: "minValue",
    default: null,
    isDefault: (value) => value === null,
    parse: positiveNumberOrNull,
    serialise: (value) => String(value),
    matches: (value, record) => {
      if (value === null) return true;
      return record.value >= Number(value);
    },
  },
  {
    key: "date",
    default: null,
    isDefault: (value) => value === null,
    parse: normaliseDate,
    serialise: (value) => String(value),
    matches: (value, record) => {
      if (value === null) return true;
      return record.date === value;
    },
  },
];

const emptyFilters: TestFilters = { name: "", minValue: null, date: null };

describe("countActiveFilters", () => {
  it("returns 0 for empty filters", () => {
    expect(countActiveFilters(emptyFilters, testSpec)).toBe(0);
  });

  it("counts one active filter", () => {
    const filters: TestFilters = { name: "test", minValue: null, date: null };
    expect(countActiveFilters(filters, testSpec)).toBe(1);
  });

  it("counts multiple active filters", () => {
    const filters: TestFilters = { name: "test", minValue: 10, date: "2026-03-15" };
    expect(countActiveFilters(filters, testSpec)).toBe(3);
  });

  it("treats zero as an active filter for numbers", () => {
    const filters: TestFilters = { name: "", minValue: 0, date: null };
    expect(countActiveFilters(filters, testSpec)).toBe(1);
  });

  it("treats empty string as inactive for text fields", () => {
    const filters: TestFilters = { name: "", minValue: null, date: null };
    expect(countActiveFilters(filters, testSpec)).toBe(0);
  });
});

describe("isEmptyFilters", () => {
  it("returns true for empty filters", () => {
    expect(isEmptyFilters(emptyFilters, testSpec)).toBe(true);
  });

  it("returns false when any filter is active", () => {
    const filters: TestFilters = { name: "test", minValue: null, date: null };
    expect(isEmptyFilters(filters, testSpec)).toBe(false);
  });
});

describe("matchesFilters", () => {
  const record: TestRecord = { name: "TestItem", value: 100, date: "2026-03-15" };

  it("matches when all filters are empty", () => {
    expect(matchesFilters(record, emptyFilters, testSpec)).toBe(true);
  });

  it("matches when name filter matches", () => {
    const filters: TestFilters = { name: "test", minValue: null, date: null };
    expect(matchesFilters(record, filters, testSpec)).toBe(true);
  });

  it("does not match when name filter fails", () => {
    const filters: TestFilters = { name: "other", minValue: null, date: null };
    expect(matchesFilters(record, filters, testSpec)).toBe(false);
  });

  it("matches when minValue filter is satisfied", () => {
    const filters: TestFilters = { name: "", minValue: 50, date: null };
    expect(matchesFilters(record, filters, testSpec)).toBe(true);
  });

  it("does not match when minValue filter fails", () => {
    const filters: TestFilters = { name: "", minValue: 200, date: null };
    expect(matchesFilters(record, filters, testSpec)).toBe(false);
  });

  it("matches when all filters are satisfied", () => {
    const filters: TestFilters = { name: "test", minValue: 50, date: "2026-03-15" };
    expect(matchesFilters(record, filters, testSpec)).toBe(true);
  });

  it("does not match when any filter fails", () => {
    const filters: TestFilters = { name: "test", minValue: 50, date: "2026-01-01" };
    expect(matchesFilters(record, filters, testSpec)).toBe(false);
  });
});

describe("filtersToQueryString", () => {
  it("returns empty string for empty filters", () => {
    expect(filtersToQueryString(emptyFilters, testSpec)).toBe("");
  });

  it("serialises one active filter", () => {
    const filters: TestFilters = { name: "test", minValue: null, date: null };
    expect(filtersToQueryString(filters, testSpec)).toBe("name=test");
  });

  it("serialises multiple active filters", () => {
    const filters: TestFilters = { name: "test", minValue: 10, date: "2026-03-15" };
    const result = filtersToQueryString(filters, testSpec);
    expect(result).toContain("name=test");
    expect(result).toContain("minVal=10");
    expect(result).toContain("date=2026-03-15");
  });

  it("uses the key property, not the field property", () => {
    const filters: TestFilters = { name: "", minValue: 10, date: null };
    const result = filtersToQueryString(filters, testSpec);
    expect(result).toBe("minVal=10");
    expect(result).not.toContain("minValue");
  });

  it("omits default values", () => {
    const filters: TestFilters = { name: "", minValue: null, date: null };
    expect(filtersToQueryString(filters, testSpec)).toBe("");
  });
});

describe("filtersFromQueryString", () => {
  it("returns defaults for empty query string", () => {
    const result = filtersFromQueryString("", testSpec, emptyFilters);
    expect(result).toEqual(emptyFilters);
  });

  it("parses one filter from query string", () => {
    const result = filtersFromQueryString("name=test", testSpec, emptyFilters);
    expect(result).toEqual({ name: "test", minValue: null, date: null });
  });

  it("parses multiple filters from query string", () => {
    const result = filtersFromQueryString("name=test&minVal=10&date=2026-03-15", testSpec, emptyFilters);
    expect(result).toEqual({ name: "test", minValue: 10, date: "2026-03-15" });
  });

  it("accepts URLSearchParams directly", () => {
    const params = new URLSearchParams("name=test&minVal=10");
    const result = filtersFromQueryString(params, testSpec, emptyFilters);
    expect(result).toEqual({ name: "test", minValue: 10, date: null });
  });

  it("ignores unknown parameters", () => {
    const result = filtersFromQueryString("name=test&unknown=value", testSpec, emptyFilters);
    expect(result).toEqual({ name: "test", minValue: null, date: null });
  });

  it("falls back to default for invalid values", () => {
    const result = filtersFromQueryString("minVal=invalid", testSpec, emptyFilters);
    expect(result).toEqual(emptyFilters);
  });

  it("treats empty parameter value as unset", () => {
    const result = filtersFromQueryString("name=&minVal=10", testSpec, emptyFilters);
    expect(result).toEqual({ name: "", minValue: 10, date: null });
  });

  it("preserves defaults for missing parameters", () => {
    const result = filtersFromQueryString("name=test", testSpec, emptyFilters);
    expect(result.minValue).toBeNull();
    expect(result.date).toBeNull();
  });
});

describe("normaliseDate", () => {
  it("accepts valid YYYY-MM-DD format", () => {
    expect(normaliseDate("2026-03-15")).toBe("2026-03-15");
  });

  it("returns null for invalid format", () => {
    expect(normaliseDate("2026/03/15")).toBeNull();
    expect(normaliseDate("15-03-2026")).toBeNull();
    expect(normaliseDate("2026-3-5")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normaliseDate("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(normaliseDate(null)).toBeNull();
  });

  it("returns null for non-date strings", () => {
    expect(normaliseDate("not a date")).toBeNull();
  });
});

describe("positiveNumberOrNull", () => {
  it("parses valid positive numbers", () => {
    expect(positiveNumberOrNull("10")).toBe(10);
    expect(positiveNumberOrNull("10.5")).toBe(10.5);
  });

  it("accepts zero as a valid bound", () => {
    expect(positiveNumberOrNull("0")).toBe(0);
  });

  it("returns null for negative numbers", () => {
    expect(positiveNumberOrNull("-10")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(positiveNumberOrNull("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(positiveNumberOrNull("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(positiveNumberOrNull(null)).toBeNull();
  });

  it("returns null for infinity", () => {
    expect(positiveNumberOrNull("Infinity")).toBeNull();
  });

  it("returns null for NaN", () => {
    expect(positiveNumberOrNull("NaN")).toBeNull();
  });

  it("handles whitespace", () => {
    expect(positiveNumberOrNull("  10  ")).toBe(10);
    expect(positiveNumberOrNull("   ")).toBeNull();
  });
});

describe("positiveIntOrNull", () => {
  it("parses valid positive integers", () => {
    expect(positiveIntOrNull("10")).toBe(10);
    expect(positiveIntOrNull("0")).toBe(0);
  });

  it("returns null for decimal numbers", () => {
    expect(positiveIntOrNull("10.5")).toBeNull();
  });

  it("returns null for negative numbers", () => {
    expect(positiveIntOrNull("-10")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(positiveIntOrNull("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(positiveIntOrNull("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(positiveIntOrNull(null)).toBeNull();
  });

  it("handles whitespace", () => {
    expect(positiveIntOrNull("  10  ")).toBe(10);
  });
});

describe("textOrNull", () => {
  it("returns trimmed non-empty strings", () => {
    expect(textOrNull("test")).toBe("test");
    expect(textOrNull("  test  ")).toBe("test");
  });

  it("returns null for empty string", () => {
    expect(textOrNull("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(textOrNull("   ")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(textOrNull(null)).toBeNull();
  });

  it("preserves internal whitespace", () => {
    expect(textOrNull("  hello  world  ")).toBe("hello  world");
  });
});

describe("oneOf", () => {
  const allowed = ["one", "two", "three"] as const;

  it("returns the value when it is in the allowed set", () => {
    expect(oneOf("two", allowed, "one")).toBe("two");
  });

  it("returns fallback when value is not in the allowed set", () => {
    expect(oneOf("four", allowed, "one")).toBe("one");
  });

  it("returns fallback for null input", () => {
    expect(oneOf(null, allowed, "one")).toBe("one");
  });

  it("returns fallback for empty string", () => {
    expect(oneOf("", allowed, "one")).toBe("one");
  });
});

describe("substringField", () => {
  const field = substringField<TestRecord>("name", (r) => r.name);

  it("matches when substring is found (case-insensitive)", () => {
    const record: TestRecord = { name: "TestItem", value: 100 };
    expect(field.matches("test", record)).toBe(true);
    expect(field.matches("item", record)).toBe(true);
    expect(field.matches("TESTITEM", record)).toBe(true);
  });

  it("does not match when substring is not found", () => {
    const record: TestRecord = { name: "TestItem", value: 100 };
    expect(field.matches("other", record)).toBe(false);
  });

  it("matches all records when value is empty", () => {
    const record: TestRecord = { name: "TestItem", value: 100 };
    expect(field.matches("", record)).toBe(true);
    expect(field.matches("   ", record)).toBe(true);
  });

  it("handles null record values", () => {
    const fieldWithNull = substringField<{ name: string | null }>("name", (r) => r.name);
    expect(fieldWithNull.matches("test", { name: null })).toBe(false);
  });

  it("parses text correctly", () => {
    expect(field.parse("test")).toBe("test");
    expect(field.parse("  test  ")).toBe("test");
    expect(field.parse("")).toBe("");
    expect(field.parse(null)).toBe("");
  });

  it("serialises text correctly", () => {
    expect(field.serialise("test")).toBe("test");
    expect(field.serialise("  test  ")).toBe("test");
  });

  it("identifies default correctly", () => {
    expect(field.isDefault("")).toBe(true);
    expect(field.isDefault("   ")).toBe(true);
    expect(field.isDefault("test")).toBe(false);
  });
});

describe("minNumberField", () => {
  const field = minNumberField<TestRecord>("minVal", (r) => r.value);

  it("matches when record value meets minimum", () => {
    const record: TestRecord = { name: "Test", value: 100 };
    expect(field.matches(50, record)).toBe(true);
    expect(field.matches(100, record)).toBe(true);
  });

  it("does not match when record value is below minimum", () => {
    const record: TestRecord = { name: "Test", value: 100 };
    expect(field.matches(150, record)).toBe(false);
  });

  it("matches all records when value is null", () => {
    const record: TestRecord = { name: "Test", value: 100 };
    expect(field.matches(null, record)).toBe(true);
  });

  it("does not match when record has no numeric value", () => {
    const fieldWithNull = minNumberField<{ value: number | null }>("minVal", (r) => r.value);
    expect(fieldWithNull.matches(50, { value: null })).toBe(false);
  });

  it("parses numbers correctly", () => {
    expect(field.parse("10")).toBe(10);
    expect(field.parse("0")).toBe(0);
    expect(field.parse("10.5")).toBe(10.5);
    expect(field.parse("invalid")).toBeNull();
    expect(field.parse(null)).toBeNull();
  });

  it("serialises numbers correctly", () => {
    expect(field.serialise(10)).toBe("10");
    expect(field.serialise(10.5)).toBe("10.5");
  });

  it("identifies default correctly", () => {
    expect(field.isDefault(null)).toBe(true);
    expect(field.isDefault(undefined)).toBe(true);
    expect(field.isDefault(0)).toBe(false);
    expect(field.isDefault(10)).toBe(false);
  });
});
