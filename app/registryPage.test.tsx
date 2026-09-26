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
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const connectWallet = vi.hoisted(() => vi.fn());
const getConnectedAddress = vi.hoisted(() => vi.fn());
const getActiveProfiles = vi.hoisted(() => vi.fn());
const getContractsByOwner = vi.hoisted(() => vi.fn());
const getActiveContractsByCategory = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ query: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/registry",
  useSearchParams: () => new URLSearchParams(nav.query),
}));

vi.mock("@/lib/wallet", () => ({
  connectWallet,
  getConnectedAddress,
  signWithWallet: vi.fn(),
  disconnectWallet: vi.fn(),
}));

vi.mock("@/lib/registry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/registry")>("@/lib/registry");
  return {
    ...actual,
    getActiveContracts,
    getContractsByOwner,
    getActiveContractsByCategory,
    withCategories: async (entries: unknown[]) => entries,
  };
});

vi.mock("@/lib/graphql", () => ({
  gqlFetch: vi.fn().mockResolvedValue({ events: { items: [] } }),
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import RegistryPage from "./registry/page";

const OWNER = "GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const C1 = "CCONTRACTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const profile = (name: string, reputation: { stake?: bigint; verified?: boolean; slashedTotal?: bigint } = {}) => ({
  contractId: C1,
  owner: OWNER,
  name,
  description: "A DeFi protocol",
  active: true,
  registeredAt: 500,
  reputation: {
    stake: reputation.stake ?? BigInt(0),
    verified: reputation.verified ?? false,
    slashedTotal: reputation.slashedTotal ?? BigInt(0),
    withdrawLockedUntil: 0,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  nav.query = "";
  getActiveContractsByCategory.mockResolvedValue([entry("Gaming Protocol")]);
  getConnectedAddress.mockResolvedValue(null);
  getActiveProfiles.mockResolvedValue([profile("Global Protocol")]);
  getContractsByOwner.mockResolvedValue([profile("My Protocol")]);
  getSlashes.mockResolvedValue([]);
});

afterEach(cleanup);

describe("RegistryPage", () => {
  it("offers connection and the global list when no wallet is connected", async () => {
    render(<RegistryPage />);

    expect(await screen.findByRole("button", { name: /connect wallet/i })).toBeTruthy();
    expect(await screen.findByText("Global Protocol")).toBeTruthy();
    // Nothing owner-scoped is reachable without a wallet.
    expect(screen.getByRole("tab", { name: /my contracts/i }).hasAttribute("disabled")).toBe(true);
  });

  it("shows the reputation signal an entry carries: verified and stake", async () => {
    getActiveProfiles.mockResolvedValue([profile("Staked One", { stake: BigInt(12_500_000_000), verified: true })]);

    render(<RegistryPage />);

    await screen.findByText("Staked One");
    // Icon *and* text — never colour alone.
    expect(await screen.findByRole("img", { name: /attested by registry governance/i })).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Staked 1,250 XLM")).toBeTruthy();
  });

  it("omits the badges an entry has not earned", async () => {
    getActiveProfiles.mockResolvedValue([profile("Plain One")]);

    render(<RegistryPage />);

    await screen.findByText("Plain One");
    expect(screen.queryByText("Verified")).toBeNull();
    expect(screen.queryByText(/^Staked /)).toBeNull();
  });

  it("loads slash history on expand and shows reasons with their ledgers", async () => {
    getActiveProfiles.mockResolvedValue([profile("Slashed One", { slashedTotal: BigInt(100_000_000) })]);
    getSlashes.mockResolvedValue([
      { amount: BigInt(100_000_000), reason: "Stale event schema", slashedAt: 9000 },
    ]);

    render(<RegistryPage />);

    await screen.findByText("Slashed One");
    // Lazy: the per-contract read happens on expand, not for the whole list.
    expect(getSlashes).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /slash history/i }));

    expect(await screen.findByText("Stale event schema")).toBeTruthy();
    expect(screen.getByText("−10 XLM")).toBeTruthy();
    expect(screen.getByText(/ledger 9,000/)).toBeTruthy();
    expect(getSlashes).toHaveBeenCalledWith(C1);
  });

  it("shows the lifetime slashed total from the profile read, without a per-row fetch", async () => {
    getActiveProfiles.mockResolvedValue([profile("Slashed One", { slashedTotal: BigInt(250_000_000) })]);

    render(<RegistryPage />);

    await screen.findByText("Slashed One");
    expect(screen.getByText("Slashed 25 XLM")).toBeTruthy();
  });

  it("shows the owner dashboard once a wallet connects", async () => {
    connectWallet.mockResolvedValue({ address: OWNER });
    render(<RegistryPage />);

    await userEvent.click(await screen.findByRole("button", { name: /connect wallet/i }));

    // Connecting switches to My Contracts, since that is why you connected.
    expect(await screen.findByText("My Protocol")).toBeTruthy();
    expect(getContractsByOwner).toHaveBeenCalledWith(OWNER);
  });

  it("reports a refused wallet connection without breaking the page", async () => {
    connectWallet.mockResolvedValue({ error: "Modal closed" });
    render(<RegistryPage />);

    await userEvent.click(await screen.findByRole("button", { name: /connect wallet/i }));

    expect((await screen.findByRole("alert")).textContent).toContain("Modal closed");
    // Still offering to connect, rather than stuck mid-flow.
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeTruthy();
  });

  it("opens on the owner dashboard when a wallet is already connected", async () => {
    getConnectedAddress.mockResolvedValue(OWNER);
    render(<RegistryPage />);

    expect(await screen.findByText("My Protocol")).toBeTruthy();
    expect(connectWallet).not.toHaveBeenCalled();
  });

  it("switches back to the global list on demand", async () => {
    getConnectedAddress.mockResolvedValue(OWNER);
    render(<RegistryPage />);

    await screen.findByText("My Protocol");
    await userEvent.click(screen.getByRole("tab", { name: /recently registered/i }));

    expect(await screen.findByText("Global Protocol")).toBeTruthy();
  });

  it("surfaces a failed registry read on the global list", async () => {
    getActiveProfiles.mockRejectedValue(new Error("Registry simulation failed"));
    render(<RegistryPage />);

    await waitFor(() => expect(screen.getByText("Registry simulation failed")).toBeTruthy());
  });

  it("asks the contract for the category named in the URL", async () => {
    nav.query = "category=Gaming";
    render(<RegistryPage />);

    expect(await screen.findByText("Gaming Protocol")).toBeTruthy();
    expect(getActiveContractsByCategory).toHaveBeenCalledWith("Gaming");
    expect(getActiveContracts).not.toHaveBeenCalled();
  });

  it("writes the chosen category to the URL", async () => {
    render(<RegistryPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Gaming" }));

    expect(nav.replace).toHaveBeenCalledWith("/registry?category=Gaming", { scroll: false });
  });

  it("renders categories where present and no gap where absent", async () => {
    getActiveContracts.mockResolvedValue([
      { ...entry("Tagged"), categories: ["DeFi"] },
      { ...entry("Legacy"), contractId: "CLEGACY", categories: [] },
    ]);
    render(<RegistryPage />);

    await screen.findByText("Tagged");
    expect(screen.getAllByLabelText("Categories")).toHaveLength(1);
  });
});
