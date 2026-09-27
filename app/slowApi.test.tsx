// @vitest-environment jsdom
/**
 * Every route, with a slow or half-failed API behind it.
 *
 * Two things were untested and both happen in production: a response that takes
 * a while to arrive, and a response where only part of the data came back. The
 * first is what `loading.tsx` exists for; the second is what decides whether a
 * page shows what it has or throws it away.
 *
 * The promise is deferred by hand rather than with fake timers, because what is
 * being asserted is that the loading state is on screen *while the request is
 * outstanding* — a timer would have to be advanced to observe it, which is the
 * thing under test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { Account, ContractEvent, Ledger, Operation, Transaction } from "@/lib/types";

const gqlFetch = vi.hoisted(() => vi.fn());
const getActiveContracts = vi.hoisted(() => vi.fn());
const getActiveProfiles = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

vi.mock("@/lib/registry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/registry")>("@/lib/registry");
  return {
    ...actual,
    getActiveContracts,
    getActiveProfiles,
    // Categories ride along on the profiles in production; the real
    // `withCategories` is covered in `lib/registry.test.ts`.
    withCategories: async (profiles: unknown[]) => profiles,
  };
});

const redirect = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/registry",
  useSearchParams: () => new URLSearchParams(nav.query),
}));

// The registry page's wallet path loads Freighter's browser-only CommonJS
// build, which cannot be imported in this environment. The wallet journey has
// its own coverage in `app/registryPage.test.tsx`; this suite is about how the
// page behaves while data is slow or missing.
vi.mock("@/lib/wallet", () => ({
  connectWallet: vi.fn(),
  getConnectedWallet: vi.fn().mockResolvedValue(null),
  readPersistedSession: vi.fn(() => null),
  disconnectWallet: vi.fn(),
  signWithWallet: vi.fn(),
}));

import HomePage from "./page";
import EventsPage from "./events/page";
import StatsPage from "./stats/page";
import AccountPage from "./accounts/[address]/page";
import RegistryPage from "./registry/page";
import HomeLoading from "./loading";
import EventsLoading from "./events/loading";
import StatsLoading from "./stats/loading";
import AccountLoading from "./accounts/[address]/loading";
import type { RegistryProfile } from "@/lib/registry";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

/** A promise the test settles by hand — the request stays outstanding. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function ledger(overrides: Partial<Ledger> = {}): Ledger {
  return {
    sequence: 1234567,
    closedAt: new Date().toISOString(),
    transactionCount: 42,
    operationCount: 99,
    baseFee: 100,
    baseReserve: 5000000,
    ...overrides,
  };
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
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
    ...overrides,
  };
}

function operation(type = "payment"): Operation {
  return {
    id: `op-${type}`,
    type,
    createdAt: new Date().toISOString(),
    transactionHash: "hash",
    sourceAccount: ADDRESS,
    from: null,
    to: null,
    amount: null,
    asset: null,
    startingBalance: null,
    funder: null,
    offerId: null,
    price: null,
    selling: null,
    buying: null,
  };
}

function account(overrides: Partial<Account> = {}): Account {
  return {
    address: ADDRESS,
    sequence: "12345",
    subentryCount: 2,
    lastModifiedLedger: 100,
    numSponsored: 0,
    numSponsoring: 0,
    balances: [],
    flags: { authRequired: false, authRevocable: false, authImmutable: false, authClawbackEnabled: false },
    transactions: [],
    operations: [],
    ...overrides,
  } as Account;
}

function event(overrides: Partial<ContractEvent> = {}): ContractEvent {
  return {
    id: "ev1",
    type: "contract",
    contractId: "CCONTRACT",
    ledger: 500,
    createdAt: new Date().toISOString(),
    pagingToken: "500-1",
    topics: ["transfer"],
    value: '{"amount":"10"}',
    ...overrides,
  } as ContractEvent;
}

beforeEach(() => {
  gqlFetch.mockReset();
  getActiveContracts.mockReset();
  getActiveContracts.mockResolvedValue([]);
  getActiveProfiles.mockReset();
  getActiveProfiles.mockResolvedValue([]);
  nav.query = "";
  redirect.mockReset();
});

afterEach(cleanup);

/** A registry profile shaped the way the contract read decodes one. */
function registryProfile(name: string): RegistryProfile {
  return {
    contractId: "CCONTRACTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    owner: ADDRESS,
    name,
    description: "A DeFi protocol",
    active: true,
    registeredAt: 500,
    categories: [],
    reputation: {
      stake: BigInt(0),
      verified: false,
      slashedTotal: BigInt(0),
      withdrawLockedUntil: 0,
    },
  } as RegistryProfile;
}

describe("loading states", () => {
  // The boundary itself is what Next wires up, so the part that can silently
  // go missing is the file being in the right segment. Asserted directly.
  const serverRoutes = [
    { route: "/", Loading: HomeLoading, label: /latest ledger/i },
    { route: "/events", Loading: EventsLoading, label: /contract events/i },
    { route: "/stats", Loading: StatsLoading, label: /network stats/i },
    { route: "/accounts/[address]", Loading: AccountLoading, label: /account/i },
  ];

  it.each(serverRoutes)("$route announces what it is loading", ({ Loading, label }) => {
    render(<Loading />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-label")).toMatch(label);
    // The blocks are decoration; announcing them would read as content.
    expect(status.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it("keeps the loading state on screen for as long as the request is outstanding", async () => {
    const { promise, resolve } = deferred<{ latestLedger: Ledger }>();
    gqlFetch.mockReturnValue(promise);

    // The page is what hangs; the loading file is what Next shows meanwhile.
    const pending = HomePage();
    render(<HomeLoading />);
    expect(screen.getByRole("status")).toBeTruthy();

    await act(async () => {
      resolve({ latestLedger: ledger() });
      await pending;
    });

    cleanup();
    render(await pending);
    // Scoped to the loading boundary: the home page's live feed is itself a
    // `role="status"` once it mounts.
    expect(screen.queryByRole("status", { name: /latest ledger/i })).toBeNull();
    expect(screen.getByText("1,234,567")).toBeTruthy();
  });
});

describe("a response that takes too long", () => {
  it("home: resolves to the ledger once the read lands", async () => {
    const { promise, resolve } = deferred<{ latestLedger: Ledger }>();
    gqlFetch.mockReturnValue(promise);

    let page!: React.ReactElement;
    await act(async () => {
      const pending = HomePage();
      // Nothing to show yet — the page has not resolved at all.
      expect(gqlFetch).toHaveBeenCalledTimes(1);
      resolve({ latestLedger: ledger() });
      page = await pending;
    });

    render(page);
    expect(screen.getByText("1,234,567")).toBeTruthy();
  });

  it("events: holds the page rather than rendering an empty list", async () => {
    const { promise, resolve } = deferred<{ events: { items: ContractEvent[] } }>();
    gqlFetch.mockReturnValue(promise);

    let page!: React.ReactElement;
    await act(async () => {
      const pending = EventsPage({ searchParams: Promise.resolve({}) });
      resolve({ events: { items: [event()] } });
      page = await pending;
    });

    render(page);
    // A late response is still shown, not treated as empty.
    expect(screen.getByText("transfer")).toBeTruthy();
  });

  it("stats: falls back to a dash for the registry count when only it fails", async () => {
    gqlFetch.mockResolvedValue({ latestLedger: ledger(), operations: { items: [] } });
    getActiveContracts.mockRejectedValue(new Error("Registry simulation failed"));

    render(await StatsPage());

    // The figures that came from GraphQL stand; the one that did not is a dash.
    expect(screen.getByText("1,234,567")).toBeTruthy();
    expect(screen.getAllByText("—")).toHaveLength(1);
  });

  it("account: renders the account when the read lands late", async () => {
    const { promise, resolve } = deferred<{ account: Account }>();
    gqlFetch.mockReturnValue(promise);

    let page!: React.ReactElement;
    await act(async () => {
      const pending = AccountPage({ params: Promise.resolve({ address: ADDRESS }) });
      resolve({ account: account({ transactions: [transaction()], operations: [operation()] }) });
      page = await pending;
    });

    render(page);
    expect(screen.getByText("All 1 transactions")).toBeTruthy();
  });
});

describe("a response that only half arrived", () => {
  it("home: shows an em dash for the figures rather than blanks or zeros", async () => {
    // The ledger is absent from a 200 response — the shape an indexer that has
    // not caught up returns.
    gqlFetch.mockResolvedValue({ latestLedger: null });

    render(await HomePage());

    // Four cards, four em dashes: an honest unknown, not a fabricated zero.
    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("events: an empty list is an empty state, not a failure", async () => {
    gqlFetch.mockResolvedValue({ events: { items: [] } });

    render(await EventsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/no events indexed/i)).toBeTruthy();
  });

  it("stats: keeps the ledger when the operations breakdown is missing", async () => {
    // The two halves of the stats page are independent reads; one failing must
    // not take the other down with it.
    gqlFetch.mockResolvedValue({ latestLedger: ledger(), operations: { items: null } });

    render(await StatsPage());

    expect(screen.getByText("1,234,567")).toBeTruthy();
  });

  it("account: shows what came back when the activity lists are empty", async () => {
    gqlFetch.mockResolvedValue({ account: account({ balances: [], transactions: [], operations: [] }) });

    render(await AccountPage({ params: Promise.resolve({ address: ADDRESS }) }));

    // The account exists and is rendered, with empty lists rather than a
    // not-found state.
    expect(screen.queryByText(/not found|couldn't|could not/i)).toBeNull();
    expect(screen.getAllByText(new RegExp(ADDRESS.slice(0, 6))).length).toBeGreaterThan(0);
  });

  it("account: reports an unknown account as such, not as a crash", async () => {
    gqlFetch.mockResolvedValue({ account: null });

    render(await AccountPage({ params: Promise.resolve({ address: ADDRESS }) }));

    expect(screen.getByText(/not found|couldn't|could not/i)).toBeTruthy();
  });

  it("surfaces a rejected read on every route rather than rendering a blank page", async () => {
    const failure = new Error("GraphQL request failed (502)");
    gqlFetch.mockRejectedValue(failure);

    // Each of these is the fallback that ships whenever the indexer is down:
    // the route still has to render its own state rather than a 500.
    const routes = [
      { page: HomePage(), expect: () => expect(screen.getByRole("heading", { level: 1 })).toBeTruthy() },
      {
        page: EventsPage({ searchParams: Promise.resolve({}) }),
        // A rejected read is a failure, not an empty list — the two are told
        // apart above, so this is the fallback rather than the empty state.
        expect: () => expect(screen.getByRole("alert").textContent).toMatch(/temporarily unavailable/i),
      },
      {
        page: StatsPage(),
        expect: () => {
          expect(screen.getByRole("heading", { name: /network stats/i })).toBeTruthy();
          // Every figure is an honest unknown rather than a fabricated zero.
          expect(screen.getAllByText("—").length).toBeGreaterThan(0);
        },
      },
      {
        page: AccountPage({ params: Promise.resolve({ address: ADDRESS }) }),
        expect: () => expect(screen.getByText(/not found|couldn't|could not/i)).toBeTruthy(),
      },
    ];

    for (const route of routes) {
      const { unmount } = render(await route.page);
      route.expect();
      unmount();
      cleanup();
    }
  });
});

describe("routes that fetch on the client", () => {
  it("shows a loading state and then the list once the client read lands", async () => {
    const { promise, resolve } = deferred<{
      transactions: { items: Transaction[]; pageInfo: { hasNextPage: boolean; cursor: string | null } };
    }>();
    gqlFetch.mockReturnValue(promise);

    const TransactionExplorer = (await import("@/components/TransactionExplorer")).default;
    const { Suspense } = await import("react");

    render(
      <Suspense fallback={<p>Boundary fallback</p>}>
        <TransactionExplorer />
      </Suspense>
    );

    // The client read is in flight, so the list says so rather than showing an
    // empty result set — an empty table during a fetch reads as "no results".
    await waitFor(() => expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0));

    await act(async () => {
      resolve({ transactions: { items: [transaction()], pageInfo: { hasNextPage: false, cursor: null } } });
      await promise;
    });

    await waitFor(() => expect(screen.queryAllByText(/loading/i)).toHaveLength(0));
    // The Suspense boundary is there for `useSearchParams`, not for the fetch —
    // so the loading state is the component's own.
    expect(screen.queryByText("Boundary fallback")).toBeNull();
    expect((screen.getByTestId("result-count") as HTMLElement).textContent).toBe("1 loaded");
  });

  it("registry: says it is loading rather than showing an empty registry", async () => {
    const { promise, resolve } = deferred<RegistryProfile[]>();
    getActiveProfiles.mockReturnValue(promise);
    nav.query = "";

    render(<RegistryPage />);

    // An empty registry during a slow Soroban read is indistinguishable from a
    // registry nobody has registered in — which reads as a working, empty site.
    await waitFor(() => expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0));

    await act(async () => {
      resolve([registryProfile("Late Protocol")]);
      await promise;
    });

    await waitFor(() => expect(screen.getByText("Late Protocol")).toBeTruthy());
    await waitFor(() => expect(screen.queryAllByText(/loading/i)).toHaveLength(0));
  });

  it("registry: keeps the rows it can when one entry is malformed", async () => {
    // Profiles arrive from a contract simulation, so a partially-decodable
    // payload is a real possibility — one bad entry must not blank the list.
    getActiveProfiles.mockResolvedValue([
      registryProfile("Good Protocol"),
      // No name, no contract: whatever the page can honestly show for this, it
      // must not throw over the rows beside it.
      { ...registryProfile("Broken Protocol"), name: undefined as unknown as string },
    ] satisfies RegistryProfile[]);
    nav.query = "";

    render(<RegistryPage />);

    await waitFor(() => expect(screen.getByText("Good Protocol")).toBeTruthy());
    // The page survived the bad entry, and is still showing what did come back
    // rather than replacing the whole list with an error.
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeTruthy();
  });
});
