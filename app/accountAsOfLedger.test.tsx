// @vitest-environment jsdom
/**
 * The account page pinned to a past ledger (#378): `/accounts/G…?ledger=N`.
 *
 * What matters is what each view asks the API and what it is willing to show.
 * A pinned view reads only the recorded state and must not mix in sections
 * that describe the account today, which would answer a question about the
 * past with current data.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

// The current-only sections are client components with their own tests and
// their own fetching. Stubbed to their names, so these tests can see which of
// them each view renders without standing up their data.
vi.mock("@/components/AccountPortfolio", () => ({
  default: () => <p>Portfolio section</p>,
}));
vi.mock("@/components/AccountActivityFeed", () => ({
  default: () => <p>Live activity section</p>,
}));
vi.mock("@/components/AccountTransactionList", () => ({
  default: () => <p>Transaction list</p>,
}));
vi.mock("@/components/AccountOperationList", () => ({
  default: () => <p>Operation list</p>,
}));
vi.mock("@/components/AccountTrustlineTimeline", () => ({
  default: () => <p>Trustline timeline</p>,
}));
vi.mock("@/components/AccountLifecycle", () => ({
  default: () => <p>Lifecycle section</p>,
}));
vi.mock("@/components/WatchIndicator", () => ({ default: () => null }));
vi.mock("@/components/CopyAddressButton", () => ({ default: () => null }));
vi.mock("@/components/ViewTracker", () => ({ default: () => null }));

import AccountPage from "./accounts/[address]/page";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

function snapshot(lastModifiedLedger: number, balance: string) {
  return {
    address: ADDRESS,
    sequence: "12345",
    subentryCount: 2,
    lastModifiedLedger,
    numSponsored: 0,
    numSponsoring: 1,
    balances: [
      {
        assetType: "native",
        assetCode: null,
        assetIssuer: null,
        balance,
        limit: null,
      },
    ],
    flags: {
      authRequired: true,
      authRevocable: false,
      authImmutable: false,
      authClawbackEnabled: false,
    },
  };
}

/** Answer each operation by name, the way the real API routes them. */
function respond(answers: Record<string, unknown>) {
  gqlFetch.mockImplementation(
    async (_url: string, doc: { toString(): string }) => {
      const name = /query\s+(\w+)/.exec(doc.toString())?.[1] ?? "";
      if (!(name in answers)) throw new Error(`unexpected query ${name}`);
      const answer = answers[name];
      if (answer instanceof Error) throw answer;
      return answer;
    },
  );
}

function queriesAsked(): string[] {
  return gqlFetch.mock.calls.map(
    ([, doc]) => /query\s+(\w+)/.exec(String(doc))?.[1] ?? "",
  );
}

async function renderPage(searchParams?: Record<string, string | string[]>) {
  return render(
    await AccountPage({
      params: Promise.resolve({ address: ADDRESS }),
      searchParams: searchParams ? Promise.resolve(searchParams) : undefined,
    }),
  );
}

beforeEach(() => {
  gqlFetch.mockReset();
});

afterEach(cleanup);

describe("AccountPage as of a ledger", () => {
  it("reads the recorded state at the ledger in the URL, and nothing else", async () => {
    respond({
      AccountAsOfLedger: { account: snapshot(51_999_000, "42.5000000") },
    });
    await renderPage({ ledger: "52000000" });

    expect(queriesAsked()).toEqual(["AccountAsOfLedger"]);
    expect(gqlFetch.mock.calls[0][2]).toEqual({
      address: ADDRESS,
      asOfLedger: 52_000_000,
    });
  });

  it("shows the recorded balances, counts and flags with what the view means", async () => {
    respond({
      AccountAsOfLedger: { account: snapshot(51_999_000, "42.5000000") },
    });
    await renderPage({ ledger: "52000000" });

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(ADDRESS);
    expect(screen.getByText("42.5")).toBeTruthy();
    expect(screen.getByText("Auth Required")).toBeTruthy();
    expect(screen.getByText("Last modified at ledger 51,999,000")).toBeTruthy();
    expect(
      screen.getByText("Viewing this account as of ledger 52,000,000"),
    ).toBeTruthy();
  });

  it("leaves out every section that describes the account today", async () => {
    respond({ AccountAsOfLedger: { account: snapshot(100, "1") } });
    await renderPage({ ledger: "100" });

    for (const section of [
      "Portfolio section",
      "Live activity section",
      "Recent Transactions",
      "Recent Operations",
      "Trustline History",
      "Lifecycle section",
    ]) {
      expect(screen.queryByText(section)).toBeNull();
    }
  });

  it("explains a ledger with no recorded state instead of calling the account missing", async () => {
    respond({ AccountAsOfLedger: { account: null } });
    await renderPage({ ledger: "1234" });

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(ADDRESS);
    expect(
      screen.getByText("No recorded state at or before ledger 1,234"),
    ).toBeTruthy();
    expect(screen.queryByText("Account Not Found")).toBeNull();
    // The control stays, so another ledger can be tried from here.
    expect(
      (screen.getByLabelText("As of ledger") as HTMLInputElement).value,
    ).toBe("1234");
  });

  it("turns away a value that is not a ledger without asking the API", async () => {
    await renderPage({ ledger: "yesterday" });

    expect(gqlFetch).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(
      /“yesterday” is not a ledger sequence/,
    );
    expect(screen.queryByText("Account Not Found")).toBeNull();
  });

  it("falls back to the unavailable state when the API cannot be reached", async () => {
    respond({ AccountAsOfLedger: new Error("GraphQL request failed (502)") });
    await renderPage({ ledger: "100" });

    expect(screen.getByText(/temporarily unavailable/i)).toBeTruthy();
    expect(screen.queryByText(/No recorded state/)).toBeNull();
  });

  it("keeps the selected network in the control", async () => {
    respond({ AccountAsOfLedger: { account: snapshot(100, "1") } });
    const { container } = await renderPage({
      ledger: "100",
      network: "testnet",
    });

    expect(
      container.querySelector<HTMLInputElement>('input[name="network"]')?.value,
    ).toBe("testnet");
  });
});

describe("AccountPage without a ledger", () => {
  const live = {
    ...snapshot(900, "7"),
    transactions: [],
    operations: [],
  };

  it("shows the current state with every section, as before, plus the control", async () => {
    respond({
      AccountDetail: { account: live },
      AccountTrustlineOps: { operations: { items: [] } },
      AccountLifecycle: { accountLifecycle: { createdAt: null } },
      AccountTrades: { trades: { items: [] } },
    });
    await renderPage();

    expect(queriesAsked().sort()).toEqual([
      "AccountDetail",
      "AccountLifecycle",
      "AccountTrades",
      "AccountTrustlineOps",
    ]);
    for (const section of [
      "Portfolio section",
      "Live activity section",
      "Recent Transactions",
      "Recent Operations",
      "Trustline History",
      "Lifecycle section",
    ]) {
      expect(screen.getByText(section)).toBeTruthy();
    }
    expect(screen.getByLabelText("As of ledger")).toBeTruthy();
    expect(screen.queryByText(/Viewing this account as of ledger/)).toBeNull();
  });

  it("treats a blank ledger, as the control submits when emptied, as the current state", async () => {
    respond({
      AccountDetail: { account: live },
      AccountTrustlineOps: { operations: { items: [] } },
      AccountLifecycle: { accountLifecycle: null },
      AccountTrades: { trades: { items: [] } },
    });
    await renderPage({ ledger: "" });

    expect(queriesAsked()).toContain("AccountDetail");
    expect(queriesAsked()).not.toContain("AccountAsOfLedger");
  });

  it("offers the control under 'not found', since a merged account's past may be recorded", async () => {
    respond({
      AccountDetail: { account: null },
      AccountTrustlineOps: { operations: { items: [] } },
      AccountLifecycle: { accountLifecycle: null },
    });
    await renderPage();

    expect(screen.getByText("Account Not Found")).toBeTruthy();
    expect(screen.getByLabelText("As of ledger")).toBeTruthy();
  });
});
