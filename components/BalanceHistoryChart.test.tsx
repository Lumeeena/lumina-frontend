// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { wcagViolations } from "@/lib/axeScan";
import { invalidateQueryCache } from "@/lib/queryCache";
import type { AreaChartProps } from "@/components/charts/AreaChart";

const gqlFetch = vi.hoisted(() => vi.fn());
const chart = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

// The chart is a shared component with its own audit; these tests cover what
// is handed to it, so it is stubbed down to its title and a record of props.
vi.mock("@/components/charts/AreaChart", () => ({
  AreaChart: (props: AreaChartProps) => {
    chart(props);
    return <h3>{props.title}</h3>;
  },
}));

import BalanceHistoryChart from "./BalanceHistoryChart";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";
const ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const DAY = 86_400_000;
const NOW = Date.parse("2026-11-21T10:15:30.000Z");
const TO = "2026-11-21T10:15:30.000Z";
const FROM = new Date(Date.parse(TO) - 90 * DAY).toISOString();

function history(snapshots: { timestamp: string; balance: string }[]) {
  return {
    accountBalanceHistory: { from: FROM, to: TO, snapshots },
  };
}

const ACTIVE = history([
  { timestamp: FROM, balance: "100" },
  // Ten days before the end of the range.
  {
    timestamp: new Date(Date.parse(TO) - 10 * DAY).toISOString(),
    balance: "250.5",
  },
]);

function renderChart(asset = "XLM", label = "XLM") {
  return render(
    <BalanceHistoryChart address={ADDRESS} asset={asset} label={label} />,
  );
}

beforeEach(() => {
  gqlFetch.mockReset();
  chart.mockReset();
  vi.spyOn(Date, "now").mockReturnValue(NOW);
  // The cache is module state, so one case's answer would otherwise satisfy
  // the next case's read and skip the fetch it asserts on.
  invalidateQueryCache();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BalanceHistoryChart", () => {
  it("asks for the selected asset over exactly the backend's 90-day maximum", async () => {
    gqlFetch.mockResolvedValue(ACTIVE);
    renderChart(`USDC:${ISSUER}`, "USDC");

    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(1));
    const variables = gqlFetch.mock.calls[0][2];
    expect(variables).toEqual({
      address: ADDRESS,
      asset: `USDC:${ISSUER}`,
      from: FROM,
      to: TO,
    });
    expect(Date.parse(variables.to) - Date.parse(variables.from)).toBe(
      90 * DAY,
    );
  });

  it("charts one point a day, carrying each balance forward", async () => {
    gqlFetch.mockResolvedValue(ACTIVE);
    renderChart(`USDC:${ISSUER}`, "USDC");

    expect(await screen.findByText("USDC balance")).toBeTruthy();
    const props = chart.mock.lastCall![0] as AreaChartProps;
    expect(props.data).toHaveLength(91);
    expect(props.data[0].value).toBe(100);
    expect(props.data[79].value).toBe(100);
    expect(props.data[80].value).toBe(250.5);
    expect(props.data[90].value).toBe(250.5);
    expect(props.unit).toBe(" USDC");
    expect(props.caption).toMatch(/last 90 days/);
    expect(props.caption).toMatch(/fees and trades are not counted/);
  });

  it("announces loading while the history is on its way", async () => {
    let resolve!: (value: unknown) => void;
    gqlFetch.mockReturnValue(new Promise((r) => (resolve = r)));
    renderChart();

    expect(screen.getByRole("status").textContent).toBe(
      "Loading XLM balance history",
    );
    resolve(ACTIVE);
    expect(await screen.findByText("XLM balance")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("says there is nothing to chart when the API has no snapshots", async () => {
    gqlFetch.mockResolvedValue(history([]));
    renderChart();

    expect(
      await screen.findByText("No XLM balance in the last 90 days"),
    ).toBeTruthy();
    expect(chart).not.toHaveBeenCalled();
  });

  it("shows the error with a retry that asks again", async () => {
    gqlFetch.mockRejectedValueOnce(
      new Error("Time range exceeds maximum of 90 days"),
    );
    gqlFetch.mockResolvedValueOnce(ACTIVE);
    renderChart();

    expect(
      await screen.findByText("Time range exceeds maximum of 90 days"),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("XLM balance")).toBeTruthy();
    expect(gqlFetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to a generic message for a non-Error failure", async () => {
    gqlFetch.mockRejectedValueOnce("offline");
    renderChart();

    expect(
      await screen.findByText("Could not load balance history."),
    ).toBeTruthy();
  });

  it("serves a repeat visit within the freshness window from the cache", async () => {
    gqlFetch.mockResolvedValue(ACTIVE);
    const first = renderChart();
    await screen.findByText("XLM balance");
    first.unmount();

    renderChart();

    expect(screen.getByText("XLM balance")).toBeTruthy();
    expect(gqlFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps a cached history on screen when its refresh fails", async () => {
    gqlFetch.mockResolvedValue(ACTIVE);
    const first = renderChart();
    await screen.findByText("XLM balance");
    first.unmount();

    // Past the freshness window, so the cached answer is shown and refreshed.
    vi.mocked(Date.now).mockReturnValue(NOW + 60_000);
    gqlFetch.mockRejectedValueOnce(new Error("backend is down"));
    renderChart();
    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByText("XLM balance")).toBeTruthy();
    expect(screen.queryByText("backend is down")).toBeNull();
  });

  it("caches an answer that lands after the chart is gone, without rendering it", async () => {
    let resolve!: (value: unknown) => void;
    gqlFetch.mockReturnValue(new Promise((r) => (resolve = r)));
    const first = renderChart();
    first.unmount();

    // Unmounting aborted the request; the answer arrives anyway.
    resolve(ACTIVE);
    await new Promise((r) => setTimeout(r, 0));
    expect(chart).not.toHaveBeenCalled();

    // It still answers the next visit, which needs no request of its own.
    renderChart();
    expect(screen.getByText("XLM balance")).toBeTruthy();
    expect(gqlFetch).toHaveBeenCalledTimes(1);
  });

  it("has no WCAG A/AA violations once the chart has loaded", async () => {
    gqlFetch.mockResolvedValue(ACTIVE);
    const { container } = renderChart();
    await screen.findByText("XLM balance");

    expect(await wcagViolations(container)).toEqual([]);
  });
});
