import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const files = vi.hoisted(() => new Map());
afterEach(() => vi.unstubAllEnvs());
vi.mock("node:fs", () => ({
  mkdirSync: vi.fn(),
  existsSync: (name) => files.has(name),
  readFileSync: (name) => files.get(name),
  writeFileSync: (name, value) => files.set(name, value),
  appendFileSync: (name, value) =>
    files.set(name, (files.get(name) ?? "") + value),
}));
import VitalsReporter from "./vitals-reporter.mjs";

const samples = [{ LCP: 1000, CLS: 0, INP: 100 }];
function reporter(values = samples) {
  const report = new VitalsReporter();
  report.onTestEnd(
    { title: "vitals /" },
    {
      status: "passed",
      attachments: [
        {
          name: "web-vitals",
          body: Buffer.from(JSON.stringify({ route: "/", samples: values })),
        },
      ],
    },
  );
  return report;
}

beforeEach(() => {
  files.clear();
  vi.unstubAllEnvs();
  vi.stubEnv("CI", "");
  vi.stubEnv("UPDATE_VITALS", "0");
  vi.stubEnv("VITALS_REFERENCE_RUN", "0");
  files.set(
    "vitals-budget.json",
    JSON.stringify({
      scenario: "fixture",
      routes: {
        "/": {
          baseline: { LCP: null, CLS: null, INP: null },
          budget: { LCP: 2500, CLS: 0.1, INP: 200 },
        },
      },
    }),
  );
});

describe("CI vitals reporter", () => {
  it("keeps unmeasured reference values unavailable and writes the report artifact", () => {
    expect(reporter().onEnd()).toEqual({ status: "passed" });
    expect(files.get("test-results/vitals/report.md")).toContain("Unavailable");
  });
  it("uses a measured PR base for signed deltas", () => {
    files.set(
      "vitals-reference.json",
      JSON.stringify({ samples: { "/": [{ LCP: 800, CLS: 0, INP: 50 }] } }),
    );
    expect(reporter().onEnd()).toEqual({ status: "passed" });
    expect(files.get("test-results/vitals/report.md")).toContain("+200 ms");
  });
  it("fails an over-budget candidate", () => {
    expect(reporter([{ LCP: 3000, CLS: 0, INP: 100 }]).onEnd()).toEqual({
      status: "failed",
    });
  });
  it("records base samples independently of candidate budgets", () => {
    vi.stubEnv("VITALS_REFERENCE_RUN", "1");
    files.delete("vitals-budget.json");
    expect(reporter().onEnd()).toEqual({ status: "passed" });
    expect(JSON.parse(files.get("vitals-reference.json")).samples["/"]).toEqual(
      samples,
    );
  });
  it("fails incomplete collection instead of accepting a partial baseline", () => {
    const report = reporter();
    report.onTestEnd(
      { title: "vitals /missing" },
      { status: "failed", attachments: [] },
    );
    expect(report.onEnd()).toEqual({ status: "failed" });
    expect(files.get("test-results/vitals/error.txt")).toContain("/missing");
  });
  it("refuses to rewrite budgets in CI", () => {
    vi.stubEnv("CI", "true");
    vi.stubEnv("UPDATE_VITALS", "1");
    const before = files.get("vitals-budget.json");
    expect(reporter().onEnd()).toEqual({ status: "failed" });
    expect(files.get("vitals-budget.json")).toBe(before);
  });
});
