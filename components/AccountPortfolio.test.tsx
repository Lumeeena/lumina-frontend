// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Balance } from "@/lib/types";
import { wcagViolations } from "@/lib/axeScan";
import { invalidateQueryCache } from "@/lib/queryCache";

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

// The chart is a shared component with its own audit; these tests cover the
// selector and the loading state around it, so the chart itself is stubbed.
vi.mock("@/components/charts/AreaChart", () => ({
  AreaChart: () => null,
}));

import AccountPortfolio from "./AccountPortfolio";

const ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

const NATIVE: Balance = {
  assetType: "native",
  assetCode: null,
  assetIssuer: null,
  balance: "100",
} as Balance;

function credit(code: string, balance: string): Balance {
  return {
    assetType: "credit_alphanum4",
    assetCode: code,
    assetIssuer: ISSUER,
    balance,
  } as Balance;
}

const SERIES = {
  asset: {
    series: [{ bucketStart: "2026-03-01T00:00:00Z", volume: "5" }],
  },
};

beforeEach(() => {
  gqlFetch.mockReset();
  gqlFetch.mockResolvedValue(SERIES);
  // The volume cache is module state, so one case's answer would otherwise
  // satisfy the next case's read and skip the fetch it asserts on.
  invalidateQueryCache();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AccountPortfolio", () => {
  it("serves a repeat visit from the cache without refetching", async () => {
    const first = render(<AccountPortfolio balances={[NATIVE]} />);
    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(1));
    first.unmount();

    render(<AccountPortfolio balances={[NATIVE]} />);

    expect(gqlFetch).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cached answer is past its freshness window", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const first = render(<AccountPortfolio balances={[NATIVE]} />);
    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(1));
    first.unmount();

    now.mockReturnValue(1_000_000 + 60_000);
    render(<AccountPortfolio balances={[NATIVE]} />);

    expect(gqlFetch).toHaveBeenCalledTimes(2);
  });

  it("keeps showing a cached answer when its background refresh fails", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const first = render(<AccountPortfolio balances={[NATIVE]} />);
    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(1));
    first.unmount();

    now.mockReturnValue(1_000_000 + 60_000);
    gqlFetch.mockRejectedValueOnce(new Error("backend is down"));
    render(<AccountPortfolio balances={[NATIVE]} />);
    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(2));
    // The failure is handled in a promise continuation; let it settle first.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByText("backend is down")).toBeNull();
  });

  it("shows the error when a cold read fails with nothing cached to fall back on", async () => {
    gqlFetch.mockRejectedValueOnce(new Error("backend is down"));
    render(<AccountPortfolio balances={[NATIVE]} />);

    expect(await screen.findByText("backend is down")).toBeTruthy();
  });

  it("has no WCAG A/AA violations once the chart has loaded", async () => {
    const { container } = render(
      <AccountPortfolio balances={[NATIVE, credit("USDC", "7")]} />,
    );
    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(1));

    expect(await wcagViolations(container)).toEqual([]);
  });

  it("marks the selected asset with aria-pressed, starting from native XLM", () => {
    render(<AccountPortfolio balances={[credit("USDC", "7"), NATIVE]} />);

    expect(screen.getByRole("button", { name: "XLM" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "USDC" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("switches the chart's asset by keyboard: Tab to another asset, then Enter", async () => {
    render(<AccountPortfolio balances={[NATIVE, credit("USDC", "7")]} />);
    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(1));

    const usdc = screen.getByRole("button", { name: "USDC" });
    // XLM is first in the pill row, so one Tab lands on it and a second on USDC.
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(usdc);

    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(2));
    expect(gqlFetch.mock.calls[1][2]).toMatchObject({ asset: `USDC:${ISSUER}` });
    expect(usdc.getAttribute("aria-pressed")).toBe("true");
  });

  it("exposes the overflow toggle's state with aria-expanded", async () => {
    // Nine credit assets plus XLM is ten, so two are hidden behind "+2 more".
    const many = [NATIVE, ...Array.from({ length: 9 }, (_, i) => credit(`A${i}`, String(i)))];
    render(<AccountPortfolio balances={many} />);

    const toggle = screen.getByRole("button", { name: "+2 more" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    toggle.focus();
    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Show less" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });
});
