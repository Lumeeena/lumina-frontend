import { describe, expect, it } from "vitest";
import { parseStorageFilters, storageHref } from "./contractStorage";

describe("parseStorageFilters", () => {
  it("returns no filters when the params are absent", () => {
    expect(parseStorageFilters({})).toEqual({
      keyPrefix: undefined,
      durability: undefined,
      invalidKeyPrefix: false,
    });
  });

  it("accepts a base64 key prefix and trims surrounding whitespace", () => {
    expect(parseStorageFilters({ keyPrefix: "  AAAADwAAAAdjb3VudGVy  " })).toEqual({
      keyPrefix: "AAAADwAAAAdjb3VudGVy",
      durability: undefined,
      invalidKeyPrefix: false,
    });
  });

  it("accepts base64 padding at the end of a prefix", () => {
    expect(parseStorageFilters({ keyPrefix: "AAAA/+==" }).keyPrefix).toBe(
      "AAAA/+==",
    );
  });

  it("rejects a key prefix that is not base64 and reports it instead of filtering", () => {
    const parsed = parseStorageFilters({ keyPrefix: "counter!" });
    expect(parsed.keyPrefix).toBeUndefined();
    expect(parsed.invalidKeyPrefix).toBe(true);
  });

  it("rejects padding in the middle of a prefix", () => {
    expect(parseStorageFilters({ keyPrefix: "AA==AA" }).invalidKeyPrefix).toBe(
      true,
    );
  });

  it("treats a whitespace-only key prefix as absent, not invalid", () => {
    expect(parseStorageFilters({ keyPrefix: "   " })).toEqual({
      keyPrefix: undefined,
      durability: undefined,
      invalidKeyPrefix: false,
    });
  });

  it("uses the first value when a param is repeated", () => {
    expect(parseStorageFilters({ keyPrefix: ["AAAA", "BBBB"] }).keyPrefix).toBe(
      "AAAA",
    );
  });

  it("accepts each durability the enum defines, in any case", () => {
    expect(parseStorageFilters({ durability: "PERSISTENT" }).durability).toBe(
      "PERSISTENT",
    );
    expect(parseStorageFilters({ durability: "temporary" }).durability).toBe(
      "TEMPORARY",
    );
  });

  it("drops a durability the schema does not define", () => {
    expect(parseStorageFilters({ durability: "ARCHIVED" }).durability).toBeUndefined();
    expect(parseStorageFilters({ durability: "persistent'); --" }).durability).toBeUndefined();
  });
});

describe("storageHref", () => {
  const contractId = "CABC123";

  it("links to the bare contract page when nothing is filtered", () => {
    expect(storageHref(contractId, {})).toBe("/contracts/CABC123");
  });

  it("keeps the active filters and the cursor on a page link", () => {
    const href = storageHref(
      contractId,
      { keyPrefix: "AAAA/+==", durability: "TEMPORARY" },
      "next-cursor",
    );
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/contracts/CABC123");
    expect(url.searchParams.get("keyPrefix")).toBe("AAAA/+==");
    expect(url.searchParams.get("durability")).toBe("TEMPORARY");
    expect(url.searchParams.get("storageCursor")).toBe("next-cursor");
  });

  it("drops the cursor for the first page but keeps the filters", () => {
    const href = storageHref(contractId, { durability: "PERSISTENT" }, null);
    expect(href).toBe("/contracts/CABC123?durability=PERSISTENT");
  });

  it("round-trips through parseStorageFilters", () => {
    const filters = { keyPrefix: "AAAADwAAAAdjb3VudGVy", durability: "PERSISTENT" as const };
    const href = storageHref(contractId, filters, "c1");
    const search = new URL(href, "https://example.test").searchParams;
    const parsed = parseStorageFilters(Object.fromEntries(search));
    expect(parsed).toEqual({ ...filters, invalidKeyPrefix: false });
  });

  it("encodes a contract id that is not a plain identifier", () => {
    expect(storageHref("C A/B", {})).toBe("/contracts/C%20A%2FB");
  });
});
