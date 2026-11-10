import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatTime,
  getPreconditionSummary,
  hasPreconditions,
} from "./preconditions";

describe("lib/preconditions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("hasPreconditions", () => {
    it("returns false for null, undefined, or empty precondition objects", () => {
      expect(hasPreconditions()).toBe(false);
      expect(hasPreconditions(null)).toBe(false);
      expect(hasPreconditions({})).toBe(false);
      expect(
        hasPreconditions({
          minLedger: null,
          maxLedger: null,
          minTime: null,
          maxTime: null,
          extraSigners: [],
        }),
      ).toBe(false);
    });

    it("returns true for each individual precondition kind", () => {
      expect(hasPreconditions({ minLedger: 100 })).toBe(true);
      expect(hasPreconditions({ maxLedger: 200 })).toBe(true);
      expect(hasPreconditions({ minTime: "2026-01-01T00:00:00Z" })).toBe(true);
      expect(hasPreconditions({ maxTime: "2026-01-02T00:00:00Z" })).toBe(true);
      expect(hasPreconditions({ extraSigners: ["GABC"] })).toBe(true);
    });
  });

  describe("formatTime", () => {
    it("formats an ISO timestamp using Date.prototype.toLocaleString", () => {
      const spy = vi
        .spyOn(Date.prototype, "toLocaleString")
        .mockReturnValue("Jan 1, 2026, 12:00:00 AM UTC");

      expect(formatTime("2026-01-01T00:00:00.000Z")).toBe(
        "Jan 1, 2026, 12:00:00 AM UTC",
      );
      expect(spy).toHaveBeenCalledWith(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });
    });
  });

  describe("getPreconditionSummary", () => {
    it("returns an empty array when no preconditions are set", () => {
      expect(getPreconditionSummary()).toEqual([]);
      expect(getPreconditionSummary(null)).toEqual([]);
      expect(getPreconditionSummary({})).toEqual([]);
      expect(getPreconditionSummary({ extraSigners: [] })).toEqual([]);
    });

    it("formats ledger bounds with min, max, or open-ended bounds", () => {
      expect(
        getPreconditionSummary({ minLedger: 1000, maxLedger: 2000 }),
      ).toEqual(["Ledger: 1000 - 2000"]);
      expect(getPreconditionSummary({ minLedger: 1000 })).toEqual([
        "Ledger: 1000 - any",
      ]);
      expect(getPreconditionSummary({ maxLedger: 2000 })).toEqual([
        "Ledger: any - 2000",
      ]);
    });

    it("formats time bounds with min, max, or open-ended bounds", () => {
      vi.spyOn(Date.prototype, "toLocaleDateString")
        .mockReturnValueOnce("1/1/2026")
        .mockReturnValueOnce("1/2/2026")
        .mockReturnValueOnce("1/1/2026")
        .mockReturnValueOnce("1/2/2026");

      expect(
        getPreconditionSummary({
          minTime: "2026-01-01T00:00:00Z",
          maxTime: "2026-01-02T00:00:00Z",
        }),
      ).toEqual(["Time: 1/1/2026 - 1/2/2026"]);
      expect(
        getPreconditionSummary({ minTime: "2026-01-01T00:00:00Z" }),
      ).toEqual(["Time: 1/1/2026 - any"]);
      expect(
        getPreconditionSummary({ maxTime: "2026-01-02T00:00:00Z" }),
      ).toEqual(["Time: any - 1/2/2026"]);
    });

    it("formats extra signers count and combines all precondition kinds in order", () => {
      vi.spyOn(Date.prototype, "toLocaleDateString")
        .mockReturnValueOnce("3/1/2026")
        .mockReturnValueOnce("3/5/2026");

      expect(
        getPreconditionSummary({
          minLedger: 50,
          maxLedger: 60,
          minTime: "2026-03-01T00:00:00Z",
          maxTime: "2026-03-05T00:00:00Z",
          extraSigners: ["GSIGNER1", "GSIGNER2"],
        }),
      ).toEqual([
        "Ledger: 50 - 60",
        "Time: 3/1/2026 - 3/5/2026",
        "Extra signers: 2",
      ]);
    });
  });
});
