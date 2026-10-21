// @vitest-environment jsdom
/**
 * The Registry page's own composition: wallet connect, tab switching, and the
 * refresh wiring between the form and the two lists.
 *
 * Its children are tested in depth next to themselves — this covers what only
 * exists here, and the connect branch in particular, which is the one piece of
 * the wallet journey that no other test reaches.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';

const connectWallet = vi.hoisted(() => vi.fn());
const getConnectedWallet = vi.hoisted(() => vi.fn());
const checkNetworkMismatch = vi.hoisted(() => vi.fn());
const readPersistedSession = vi.hoisted(() => vi.fn());
const getActiveProfiles = vi.hoisted(() => vi.fn());
const getSlashes = vi.hoisted(() => vi.fn());
const getContractsByOwner = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ query: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/registry",
  useSearchParams: () => new URLSearchParams(nav.query),
}));

vi.mock("@/lib/wallet", () => ({
  connectWallet,
  getConnectedWallet,
  checkNetworkMismatch,
  readPersistedSession,
  disconnectWallet: vi.fn(),
  signWithWallet: vi.fn(),
  checkNetworkMismatch: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/registry", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/registry")>("@/lib/registry");
  return {
    ...actual,
    getActiveProfiles,
    getContractsByOwner,
    getSlashes,
    // Categories arrive attached to the profiles in production; here the
    // profiles are built already carrying them.
    withCategories: async (profiles: unknown[]) => profiles,
  };
});

vi.mock("@/lib/graphql", () => ({
  gqlFetch: vi.fn().mockResolvedValue({ events: { items: [] } }),
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import RegistryWorkspace from "@/components/RegistryWorkspace";
import RegistryListing from "@/components/RegistryListing";

vi.mock("next/cache", () => ({ unstable_cache: (read: () => unknown) => read }));
vi.mock("@/app/registry/actions", () => ({ refreshRegistry: vi.fn() }));

async function renderRegistry() {
  const raw = new URLSearchParams(nav.query).get('category');
  const { isCategory } = await import('@/lib/registry');
  const listing = await RegistryListing({ category: isCategory(raw) ? raw : null });
  return render(<RegistryWorkspace listing={listing} />);
}

const OWNER = "GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const C1 = "CCONTRACTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const session = (address: string) => ({
  address,
  walletId: "freighter",
  walletName: "Freighter",
  walletIcon: "freighter.svg",
});

const profile = (
  name: string,
  reputation: { stake?: bigint; verified?: boolean; slashedTotal?: bigint } = {},
  categories: string[] = []
) => ({
  contractId: C1,
  owner: OWNER,
  name,
  description: "A DeFi protocol",
  active: true,
  registeredAt: 500,
  categories,
  reputation: {
    stake: reputation.stake ?? BigInt(0),
    verified: reputation.verified ?? false,
    slashedTotal: reputation.slashedTotal ?? BigInt(0),
    withdrawLockedUntil: 0,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IntersectionObserver", class {
    private callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe = (target: Element) => queueMicrotask(() =>
      this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    );
    unobserve = vi.fn();
    disconnect = vi.fn();
  });
  nav.query = "";
  // Nothing persisted, nothing connected: the state a first-time visitor gets.
  readPersistedSession.mockReturnValue(null);
  getConnectedWallet.mockResolvedValue(null);
  checkNetworkMismatch.mockResolvedValue(null);
  getActiveProfiles.mockResolvedValue([profile("Global Protocol")]);
  getContractsByOwner.mockResolvedValue([profile("My Protocol")]);
  getSlashes.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RegistryPage", () => {
  it("waits until the global list nears the viewport before mounting its cards", async () => {
    let onIntersect!: IntersectionObserverCallback;
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { onIntersect = callback; }
      observe = observe;
      unobserve = unobserve;
      disconnect = disconnect;
    });

    render(<RegistryPage />);
    expect(await screen.findByText(/registry entries will load as you scroll/i)).toBeTruthy();
    expect(screen.queryByText("Global Protocol")).toBeNull();
    expect(screen.getByTestId("registry-list").style.minHeight).toBe("144px");
    await waitFor(() => expect(observe).toHaveBeenCalledTimes(1));

    act(() => onIntersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(await screen.findByText("Global Protocol")).toBeTruthy();
    expect(disconnect).toHaveBeenCalled();
  });

  it("offers connection and the global list when no wallet is connected", async () => {
    await renderRegistry();

    expect(
      await screen.findByRole("button", { name: /connect wallet/i }),
    ).toBeTruthy();
    expect(await screen.findByText("Global Protocol")).toBeTruthy();
    // Nothing owner-scoped is reachable without a wallet.
    expect(
      screen
        .getByRole("tab", { name: /my contracts/i })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("shows the reputation signal an entry carries: verified and stake", async () => {
    getActiveProfiles.mockResolvedValue([
      profile("Staked One", { stake: BigInt(12_500_000_000), verified: true }),
    ]);

    await renderRegistry();

    await screen.findByText("Staked One");
    // Icon *and* text — never colour alone.
    expect(
      await screen.findByTitle("Attested by registry governance"),
    ).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Staked 1,250 XLM")).toBeTruthy();
  });

  it("omits the badges an entry has not earned", async () => {
    getActiveProfiles.mockResolvedValue([profile("Plain One")]);

    await renderRegistry();

    await screen.findByText("Plain One");
    expect(screen.queryByText("Verified")).toBeNull();
    expect(screen.queryByText(/^Staked /)).toBeNull();
  });

  it("loads slash history on expand and shows reasons with their ledgers", async () => {
    getActiveProfiles.mockResolvedValue([
      profile("Slashed One", { slashedTotal: BigInt(100_000_000) }),
    ]);
    getSlashes.mockResolvedValue([
      {
        amount: BigInt(100_000_000),
        reason: "Stale event schema",
        slashedAt: 9000,
      },
    ]);

    await renderRegistry();

    await screen.findByText("Slashed One");
    // Lazy: the per-contract read happens on expand, not for the whole list.
    expect(getSlashes).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /slash history/i }),
    );

    // The reason sits beside the amount in one line, so match the words rather
    // than the whole element.
    expect(await screen.findByText(/Stale event schema/)).toBeTruthy();
    expect(screen.getByText("−10 XLM")).toBeTruthy();
    expect(screen.getByText(/ledger 9,000/)).toBeTruthy();
    expect(getSlashes).toHaveBeenCalledWith(C1);
  });

  it("offers a working retry when slash history cannot be read", async () => {
    getSlashes.mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce([]);
    render(<RegistryPage />);

    await screen.findByText("Global Protocol");
    await userEvent.click(screen.getByRole("button", { name: "Slash history" }));
    expect(await screen.findByRole("button", { name: "Retry history" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Retry history" }));
    expect(await screen.findByText("No slashes recorded.")).toBeTruthy();
    expect(getSlashes).toHaveBeenCalledTimes(2);
  });

  it("shows the lifetime slashed total from the profile read, without a per-row fetch", async () => {
    getActiveProfiles.mockResolvedValue([
      profile("Slashed One", { slashedTotal: BigInt(250_000_000) }),
    ]);

    await renderRegistry();

    await screen.findByText("Slashed One");
    expect(screen.getByText("Slashed 25 XLM")).toBeTruthy();
  });

  it("shows the owner dashboard once a wallet connects", async () => {
    connectWallet.mockResolvedValue({ address: OWNER });
    getConnectedWallet.mockResolvedValue(session(OWNER));
    await renderRegistry();

    await userEvent.click(
      await screen.findByRole("button", { name: /connect wallet/i }),
    );

    // Connecting switches to My Contracts, since that is why you connected.
    expect(await screen.findByText("My Protocol")).toBeTruthy();
    expect(getContractsByOwner).toHaveBeenCalledWith(OWNER);
  });

  it("reports a refused wallet connection without breaking the page", async () => {
    connectWallet.mockResolvedValue({ error: "Modal closed" });
    await renderRegistry();

    await userEvent.click(
      await screen.findByRole("button", { name: /connect wallet/i }),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Modal closed",
    );
    // Still offering to connect, rather than stuck mid-flow.
    expect(
      screen.getByRole("button", { name: /connect wallet/i }),
    ).toBeTruthy();
  });

  it("shows a network change action when the connected wallet uses the wrong network", async () => {
    connectWallet.mockResolvedValue({ address: OWNER });
    getConnectedWallet.mockResolvedValue(session(OWNER));
    checkNetworkMismatch.mockResolvedValue({ error: "Network mismatch" });
    render(<RegistryPage />);

    await userEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/switch your wallet to the stellar testnet/i);
  });

  it("recovers from a failed saved wallet session", async () => {
    readPersistedSession.mockReturnValue({ address: OWNER, walletId: "freighter" });
    getConnectedWallet.mockRejectedValue(new Error("extension unavailable"));
    render(<RegistryPage />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/saved wallet session could not be restored/i);
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeTruthy();
  });

  it("opens on the owner dashboard when a wallet is already connected", async () => {
    readPersistedSession.mockReturnValue({ address: OWNER, walletId: "freighter" });
    getConnectedWallet.mockResolvedValue(session(OWNER));
    await renderRegistry();

    expect(await screen.findByText("My Protocol")).toBeTruthy();
    expect(connectWallet).not.toHaveBeenCalled();
  });

  it("confirms a persisted session without opening the picker", async () => {
    readPersistedSession.mockReturnValue({ address: OWNER, walletId: "freighter" });
    getConnectedWallet.mockResolvedValue(session(OWNER));
    await renderRegistry();

    // The seeded state says "connected, still resolving" until this lands.
    expect(await screen.findByText("Freighter")).toBeTruthy();
    expect(getConnectedWallet).toHaveBeenCalledTimes(1);
    expect(connectWallet).not.toHaveBeenCalled();
  });

  it("never asks for a session when nothing is persisted", async () => {
    await renderRegistry();

    expect(await screen.findByRole("button", { name: /connect wallet/i })).toBeTruthy();
    // No persisted session means nothing to confirm, so the wallet kit — which
    // is loaded by that confirmation — is never pulled in at all.
    expect(getConnectedWallet).not.toHaveBeenCalled();
    expect(screen.queryByText("Connecting…")).toBeNull();
  });

  it("holds the connect button in a loading state while the kit arrives", async () => {
    let finishConnect!: (result: { address: string } | { error: string }) => void;
    connectWallet.mockReturnValue(
      new Promise<{ address: string } | { error: string }>((resolve) => {
        finishConnect = resolve;
      }),
    );
    getConnectedWallet.mockResolvedValue(session(OWNER));
    await renderRegistry();

    const button = await screen.findByRole("button", { name: /connect wallet/i });
    await userEvent.click(button);

    const pending = await screen.findByRole("button", { name: /connecting/i });
    expect(pending.getAttribute("aria-busy")).toBe("true");
    expect(pending.hasAttribute("disabled")).toBe(true);

    finishConnect({ address: OWNER });

    expect(await screen.findByText("My Protocol")).toBeTruthy();
  });

  it("switches back to the global list on demand", async () => {
    readPersistedSession.mockReturnValue({ address: OWNER, walletId: "freighter" });
    getConnectedWallet.mockResolvedValue(session(OWNER));
    await renderRegistry();

    await screen.findByText("My Protocol");
    await userEvent.click(
      screen.getByRole("tab", { name: /recently registered/i }),
    );

    expect(await screen.findByText("Global Protocol")).toBeTruthy();
  });

  it("surfaces a failed registry read on the global list", async () => {
    getActiveProfiles.mockRejectedValue(
      new Error("Registry simulation failed"),
    );
    await renderRegistry();

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/temporarily unavailable/i),
    );
    // The copy is the component's, not the raw error — but the way out is here.
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
  });

  it("narrows the list to the category named in the URL", async () => {
    getActiveProfiles.mockResolvedValue([
      { ...profile("Gaming Protocol", {}, ["Gaming"]), contractId: "CGAMING" },
      { ...profile("Payments Protocol", {}, ["Payments"]), contractId: "CPAYMENTS" },
    ]);
    nav.query = "category=Gaming";
    await renderRegistry();

    expect(await screen.findByText("Gaming Protocol")).toBeTruthy();
    // The category view carries no reputation, so the filter is applied to the
    // profiles that do — one read, and every row still has its badges.
    expect(screen.queryByText("Payments Protocol")).toBeNull();
  });

  it("renders category links with shareable server navigation URLs", async () => {
    await renderRegistry();
    expect(screen.getByRole('link', { name: 'Gaming' }).getAttribute('href')).toBe('/registry?category=Gaming');
  });

  it("renders categories where present and no gap where absent", async () => {
    getActiveProfiles.mockResolvedValue([
      { ...profile("Tagged", {}, ["DeFi"]), contractId: "CTAGGED" },
      { ...profile("Legacy", {}, []), contractId: "CLEGACY" },
    ]);
    await renderRegistry();

    await screen.findByText("Tagged");
    expect(screen.getAllByLabelText("Categories")).toHaveLength(1);
  });
});
