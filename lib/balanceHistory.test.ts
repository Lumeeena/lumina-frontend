import { describe, expect, it } from "vitest";
import {
  BALANCE_HISTORY_DAYS,
  balanceHistoryRange,
  dailyBalances,
  sampleLabel,
} from "./balanceHistory";

const DAY = 86_400_000;

describe("balanceHistoryRange", () => {
  it("spans exactly the backend's 90-day maximum, ending now", () => {
    const now = Date.parse("2026-11-21T10:15:42.123Z");
    const { from, to } = balanceHistoryRange(now);

    expect(BALANCE_HISTORY_DAYS).toBe(90);
    expect(to).toBe("2026-11-21T10:15:42.123Z");
    expect(from).toBe("2026-08-23T10:15:42.123Z");
    // The backend rejects a range longer than 90 days, not one equal to it.
    expect(Date.parse(to) - Date.parse(from)).toBe(90 * DAY);
  });
});

describe("dailyBalances", () => {
  const from = "2026-11-01T00:00:00.000Z";
  const to = "2026-11-04T00:00:00.000Z";

  it("samples once a day, carrying each balance forward to the next change", () => {
    const samples = dailyBalances(
      [
        { timestamp: from, balance: "10" },
        { timestamp: "2026-11-02T12:00:00.000Z", balance: "25.5" },
      ],
      from,
      to,
    );

    expect(samples).toEqual([
      { at: "2026-11-01T00:00:00.000Z", balance: "10" },
      { at: "2026-11-02T00:00:00.000Z", balance: "10" },
      { at: "2026-11-03T00:00:00.000Z", balance: "25.5" },
      { at: "2026-11-04T00:00:00.000Z", balance: "25.5" },
    ]);
  });

  it("gives a 90-day range 91 points, one per day plus the end", () => {
    const range = balanceHistoryRange(Date.parse("2026-11-21T00:00:00Z"));
    const samples = dailyBalances(
      [{ timestamp: range.from, balance: "1" }],
      range.from,
      range.to,
    );

    expect(samples).toHaveLength(91);
    expect(samples[0].at).toBe(range.from);
    expect(samples[90].at).toBe(range.to);
  });

  it("ends on `to` even when the range is not a whole number of days", () => {
    const samples = dailyBalances(
      [{ timestamp: from, balance: "3" }],
      from,
      "2026-11-02T06:00:00.000Z",
    );

    expect(samples.map((s) => s.at)).toEqual([
      "2026-11-01T00:00:00.000Z",
      "2026-11-02T00:00:00.000Z",
      "2026-11-02T06:00:00.000Z",
    ]);
  });

  it("uses the last of several changes within one day", () => {
    const samples = dailyBalances(
      [
        { timestamp: from, balance: "1" },
        { timestamp: "2026-11-01T08:00:00.000Z", balance: "2" },
        { timestamp: "2026-11-01T20:00:00.000Z", balance: "3" },
      ],
      from,
      "2026-11-02T00:00:00.000Z",
    );

    expect(samples.map((s) => s.balance)).toEqual(["1", "3"]);
  });

  it("does not depend on the snapshots arriving in order", () => {
    const samples = dailyBalances(
      [
        { timestamp: "2026-11-02T12:00:00.000Z", balance: "7" },
        { timestamp: from, balance: "4" },
      ],
      from,
      to,
    );

    expect(samples.map((s) => s.balance)).toEqual(["4", "4", "7", "7"]);
  });

  it("leaves out days before the first known balance rather than guessing", () => {
    const samples = dailyBalances(
      [{ timestamp: "2026-11-02T12:00:00.000Z", balance: "9" }],
      from,
      to,
    );

    expect(samples).toEqual([
      { at: "2026-11-03T00:00:00.000Z", balance: "9" },
      { at: "2026-11-04T00:00:00.000Z", balance: "9" },
    ]);
  });

  it("is empty with no snapshots, an unreadable timestamp, or a reversed range", () => {
    expect(dailyBalances([], from, to)).toEqual([]);
    expect(
      dailyBalances([{ timestamp: "not a date", balance: "1" }], from, to),
    ).toEqual([]);
    expect(
      dailyBalances([{ timestamp: from, balance: "1" }], to, from),
    ).toEqual([]);
  });
});

describe("sampleLabel", () => {
  it("formats a sample as a short month and day", () => {
    const label = sampleLabel("2026-11-21T12:00:00.000Z");

    expect(label).toMatch(/Nov/);
    expect(label).toMatch(/21/);
  });
});
