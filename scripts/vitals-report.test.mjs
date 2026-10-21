import { describe, expect, it } from "vitest";
import { compareVitals, formatVitals, percentile75 } from "./vitals-report.mjs";

const budget = {
  routes: {
    "/": {
      baseline: { LCP: 1000, CLS: 0, INP: 100 },
      budget: { LCP: 1500, CLS: 0.1, INP: 200 },
    },
  },
};

describe("Core Web Vitals regression report", () => {
  it("compares PR measurements with a measured base revision", () => {
    const [row] = compareVitals(
      { "/": [{ LCP: 1200, CLS: 0, INP: 100 }] },
      budget,
      { "/": [{ LCP: 900, CLS: 0, INP: 50 }] },
    );
    expect(row.metrics.LCP.delta).toBe(300);
    expect(row.metrics.INP.delta).toBe(50);
  });
  it("labels a missing measured baseline unavailable while still enforcing the initial budget", () => {
    const initial = {
      routes: {
        "/": {
          baseline: { LCP: null, CLS: null, INP: null },
          budget: { LCP: 1500, CLS: 0.1, INP: 200 },
        },
      },
    };
    const rows = compareVitals(
      { "/": [{ LCP: 1600, CLS: 0, INP: 100 }] },
      initial,
    );
    expect(rows[0].metrics.LCP).toMatchObject({
      baseline: null,
      delta: null,
      passed: false,
    });
    expect(formatVitals(rows)).toContain("Unavailable");
  });
  it("uses nearest-rank p75, retaining slow samples rather than averaging them away", () => {
    expect(percentile75([100, 1000, 200])).toBe(1000);
  });
  it("reports a signed delta and fails each metric that exceeds its route budget", () => {
    const rows = compareVitals(
      { "/": [{ LCP: 1600, CLS: 0.12, INP: 250 }] },
      budget,
    );
    expect(rows[0].metrics.LCP).toMatchObject({ delta: 600, passed: false });
    expect(rows[0].metrics.CLS.passed).toBe(false);
    expect(rows[0].metrics.INP.passed).toBe(false);
    expect(formatVitals(rows)).toContain("+600 ms");
    expect(formatVitals(rows)).toContain("FAIL");
  });
  it("accepts values exactly on budget", () => {
    const [row] = compareVitals(
      { "/": [{ LCP: 1500, CLS: 0.1, INP: 200 }] },
      budget,
    );
    expect(Object.values(row.metrics).every((metric) => metric.passed)).toBe(
      true,
    );
  });
  it("refuses an unbudgeted route or missing INP instead of manufacturing zero", () => {
    expect(() =>
      compareVitals({ "/new": [{ LCP: 1000, CLS: 0, INP: 100 }] }, budget),
    ).toThrow("No vitals budget");
    expect(() =>
      compareVitals({ "/": [{ LCP: 1000, CLS: 0 }] }, budget),
    ).toThrow("Missing or invalid");
    expect(() => percentile75([])).toThrow("Missing or invalid");
  });
});
