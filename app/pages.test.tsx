// @vitest-environment jsdom
/**
 * Page-level tests.
 *
 * Every page wraps its data fetch in a try/catch that falls back to empty —
 * good behaviour that had never once been executed. These render each page as
 * a resolved server component against both a known GraphQL response and an
 * unreachable API, which is the branch that actually ships when the backend is
 * down.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Ledger, Operation, Transaction } from "@/lib/types";

const gqlFetch = vi.hoisted(() => vi.fn());
const getActiveContracts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

vi.mock("@/lib/registry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/registry")>("@/lib/registry");
  return { ...actual, getActiveContracts };
});

// `redirect` throws in the real implementation, to unwind rendering. Stubbing
// it lets the test assert the destination instead of catching a control-flow
// exception.
const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

import StatsPage from "./stats/page";
import EventsPage from "./events/page";
import AccountPage from "./accounts/[address]/page";
import AccountsSearchPage from "./accounts/page";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";
const UNREACHABLE = new Error("GraphQL request failed (502)");

function ledger(): Ledger {
  return {
    sequence: 1234567,
    closedAt: new Date().toISOString(),
    transactionCount: 42,
    operationCount: 99,
    baseFee: 100,
    baseReserve: 5000000,
  };
}

function operation(type: string): Operation {
  return {
    id: `op-${type}`,
    type,
    createdAt: new Date().toISOString(),
    transactionHash: "hash",
    sourceAccount: ADDRESS,
    from: null, to: null, amount: null, asset: null,
    startingBalance: null, funder: null, offerId: null,
    price: null, selling: null, buying: null,
  };
}

function transaction(): Transaction {
  return {
    hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    ledger: 1234567,
    createdAt: new Date().toISOString(),
    sourceAccount: ADDRESS,
    feeCharged: "1000000",
    operationCount: 1,
    successful: true,
    memoType: null,
    memo: null,
  };
}

/** Render an async server component. */
async function renderPage(element: Promise<React.ReactElement>) {
  return render(await element);
}

beforeEach(() => {
  gqlFetch.mockReset();
  getActiveContracts.mockReset();
  getActiveContracts.mockResolvedValue([]);
  redirect.mockReset();
});

afterEach(cleanup);

describe("StatsPage", () => {
  it("renders figures from a known response", async () => {
    gqlFetch.mockResolvedValue({
      latestLedger: ledger(),
      operations: { items: [operation("payment"), operation("payment"), operation("create_account")] },
    });
    getActiveContracts.mockResolvedValue([{ contractId: "C1" }, { contractId: "C2" }]);

    await renderPage(StatsPage());

    expect(screen.getByText("1,234,567")).toBeTruthy();
    // Two registered contracts, counted from the registry read.
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("still renders when the GraphQL API is unreachable", async () => {
    gqlFetch.mockRejectedValue(UNREACHABLE);

    await renderPage(StatsPage());

    // The fallback path: the page renders rather than throwing a 500.
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("survives the registry being unreachable independently of GraphQL", async () => {
    gqlFetch.mockResolvedValue({ latestLedger: ledger(), operations: { items: [] } });
    getActiveContracts.mockRejectedValue(new Error("Registry simulation failed"));

    await renderPage(StatsPage());

    expect(screen.getByText("1,234,567")).toBeTruthy();
  });
});

describe("EventsPage", () => {
  it("queries the contract from the URL and renders its events", async () => {
    gqlFetch.mockResolvedValue({
      events: {
        items: [
          {
            id: "ev1",
            type: "contract",
            contractId: "CCONTRACT",
            ledger: 500,
            createdAt: new Date().toISOString(),
            pagingToken: "500-1",
            topics: ["transfer"],
            value: '{"amount":"10"}',
          },
        ],
      },
    });

    await renderPage(EventsPage({ searchParams: Promise.resolve({ contractId: "CCONTRACT" }) }));

    expect(gqlFetch.mock.calls[0][2]).toMatchObject({ contractId: "CCONTRACT" });
    expect(screen.getByText("transfer")).toBeTruthy();
  });

  it("falls back to the default contract when none is given", async () => {
    gqlFetch.mockResolvedValue({ events: { items: [] } });

    await renderPage(EventsPage({ searchParams: Promise.resolve({}) }));

    expect(gqlFetch.mock.calls[0][2]).toMatchObject({
      contractId: "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ",
    });
  });

  it("trims a padded contract id rather than querying whitespace", async () => {
    gqlFetch.mockResolvedValue({ events: { items: [] } });

    await renderPage(EventsPage({ searchParams: Promise.resolve({ contractId: "  CPADDED  " }) }));

    expect(gqlFetch.mock.calls[0][2]).toMatchObject({ contractId: "CPADDED" });
  });

  it("shows the empty state when the API is unreachable", async () => {
    gqlFetch.mockRejectedValue(UNREACHABLE);

    await renderPage(EventsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/no events indexed/i)).toBeTruthy();
  });
});

describe("AccountPage", () => {
  it("renders an account from a known response", async () => {
    gqlFetch.mockResolvedValue({
      account: {
        address: ADDRESS,
        sequence: "12345",
        subentryCount: 2,
        lastModifiedLedger: 100,
        numSponsored: 0,
        numSponsoring: 0,
        balances: [{ assetType: "native", assetCode: null, assetIssuer: null, balance: "100.0000000", limit: null, buyingLiabilities: "0", sellingLiabilities: "0" }],
        flags: { authRequired: false, authRevocable: false, authImmutable: false, authClawbackEnabled: false },
        transactions: [transaction()],
        operations: [operation("payment")],
      },
    });

    await renderPage(AccountPage({ params: Promise.resolve({ address: ADDRESS }) }));

    expect(screen.getAllByText(new RegExp(ADDRESS.slice(0, 6))).length).toBeGreaterThan(0);
  });

  it("renders a not-found state for an unknown account rather than throwing", async () => {
    gqlFetch.mockResolvedValue({ account: null });

    await renderPage(AccountPage({ params: Promise.resolve({ address: ADDRESS }) }));

    expect(screen.getByText(/not found|couldn't|could not/i)).toBeTruthy();
  });

  it("renders rather than crashing when the API is unreachable", async () => {
    gqlFetch.mockRejectedValue(UNREACHABLE);

    await renderPage(AccountPage({ params: Promise.resolve({ address: ADDRESS }) }));

    expect(screen.getByText(/not found|couldn't|could not/i)).toBeTruthy();
  });
});

describe("AccountsSearchPage", () => {
  it("sends a searched address to its detail page, trimmed", async () => {
    await AccountsSearchPage({ searchParams: Promise.resolve({ address: `  ${ADDRESS}  ` }) });

    expect(redirect).toHaveBeenCalledWith(`/accounts/${ADDRESS}`);
  });

  it("falls back to the explorer when no address is given", async () => {
    await AccountsSearchPage({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith("/explorer");
  });

  it("treats a whitespace-only address as no address", async () => {
    await AccountsSearchPage({ searchParams: Promise.resolve({ address: "   " }) });

    expect(redirect).toHaveBeenCalledWith("/explorer");
  });
});
