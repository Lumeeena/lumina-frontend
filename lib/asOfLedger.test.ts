import { describe, expect, it } from "vitest";
import {
  AS_OF_LEDGER_PARAM,
  MAX_LEDGER_SEQUENCE,
  accountAtLedgerHref,
  parseAsOfLedger,
} from "./asOfLedger";

describe("parseAsOfLedger", () => {
  it("shows the current state when the parameter is absent or blank", () => {
    expect(parseAsOfLedger(undefined)).toEqual({ kind: "current" });
    expect(parseAsOfLedger("")).toEqual({ kind: "current" });
    // Submitting the control empty sends `?ledger=`, which goes back to now.
    expect(parseAsOfLedger("   ")).toEqual({ kind: "current" });
    expect(parseAsOfLedger([])).toEqual({ kind: "current" });
  });

  it("pins the page to a whole-number ledger", () => {
    expect(parseAsOfLedger("52000000")).toEqual({
      kind: "ledger",
      ledger: 52_000_000,
    });
    expect(parseAsOfLedger(" 7 ")).toEqual({ kind: "ledger", ledger: 7 });
    expect(parseAsOfLedger("1")).toEqual({ kind: "ledger", ledger: 1 });
  });

  it("uses the first of a repeated parameter", () => {
    expect(parseAsOfLedger(["10", "20"])).toEqual({
      kind: "ledger",
      ledger: 10,
    });
  });

  it("accepts the largest ledger a GraphQL Int can carry, and nothing past it", () => {
    expect(parseAsOfLedger(String(MAX_LEDGER_SEQUENCE))).toEqual({
      kind: "ledger",
      ledger: 2_147_483_647,
    });
    expect(parseAsOfLedger("2147483648")).toEqual({
      kind: "invalid",
      raw: "2147483648",
    });
  });

  it.each(["0", "-5", "1.5", "1e6", "abc", "12abc", "0x10"])(
    "turns away %j rather than asking the API",
    (raw) => {
      expect(parseAsOfLedger(raw)).toEqual({ kind: "invalid", raw });
    },
  );
});

describe("accountAtLedgerHref", () => {
  it("links to the account page pinned to the ledger", () => {
    expect(AS_OF_LEDGER_PARAM).toBe("ledger");
    expect(accountAtLedgerHref("GABC", 500)).toBe("/accounts/GABC?ledger=500");
  });
});
