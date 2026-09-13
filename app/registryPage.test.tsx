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
const getActiveContracts = vi.hoisted(() => vi.fn());
const getContractsByOwner = vi.hoisted(() => vi.fn());

vi.mock("@/lib/wallet", () => ({
  connectWallet,
  getConnectedAddress,
  signWithWallet: vi.fn(),
  disconnectWallet: vi.fn(),
}));

vi.mock("@/lib/registry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/registry")>("@/lib/registry");
  return { ...actual, getActiveContracts, getContractsByOwner };
});

vi.mock("@/lib/graphql", () => ({
  gqlFetch: vi.fn().mockResolvedValue({ events: { items: [] } }),
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import RegistryPage from "./registry/page";

const OWNER = "GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const C1 = "CCONTRACTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const entry = (name: string) => ({
  contractId: C1,
  owner: OWNER,
  name,
  description: "A DeFi protocol",
  active: true,
  registeredAt: 500,
});

beforeEach(() => {
  vi.clearAllMocks();
  getConnectedAddress.mockResolvedValue(null);
  getActiveContracts.mockResolvedValue([entry("Global Protocol")]);
  getContractsByOwner.mockResolvedValue([entry("My Protocol")]);
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
    getActiveContracts.mockRejectedValue(new Error("Registry simulation failed"));
    render(<RegistryPage />);

    await waitFor(() => expect(screen.getByText("Registry simulation failed")).toBeTruthy());
  });
});
