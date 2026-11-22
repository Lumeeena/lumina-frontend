// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { setLocale } from "@/lib/i18n";
import HomePage from "./page";

const mocks = vi.hoisted(() => ({
  query: "",
  suspend: false,
  replace: vi.fn(),
  entries: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  session: vi.fn(),
  persisted: vi.fn(),
  mismatch: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => "/",
  useSearchParams: () => {
    if (mocks.suspend) throw new Promise(() => {});
    return new URLSearchParams(mocks.query);
  },
}));
vi.mock("@/lib/registry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/registry")>()),
  getActiveProfiles: mocks.entries,
  withCategories: async (entries: unknown[]) => entries,
}));
vi.mock("@/lib/wallet", () => ({
  connectWallet: mocks.connect,
  disconnectWallet: mocks.disconnect,
  getConnectedWallet: mocks.session,
  readPersistedSession: mocks.persisted,
  checkNetworkMismatch: mocks.mismatch,
}));
vi.mock("@/components/RegistryContractInfo", () => ({ default: () => null }));
vi.mock("@/components/RegisterContractForm", () => ({ default: () => null }));
vi.mock("@/components/OwnerContracts", () => ({ default: () => null }));
vi.mock("@/components/WalletInfo", () => ({
  default: ({ onDisconnect }: { onDisconnect: () => void }) => (
    <button onClick={onDisconnect}>Disconnect test wallet</button>
  ),
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.query = "";
  mocks.suspend = false;
  mocks.entries.mockResolvedValue([]);
  mocks.persisted.mockReturnValue(null);
  mocks.session.mockResolvedValue(null);
  mocks.mismatch.mockResolvedValue(null);
  setLocale("en");
});
afterEach(() => {
  cleanup();
  setLocale("en");
});

const switchToGerman = () => act(() => setLocale("de"));
const connect = () =>
  fireEvent.click(
    screen.getByRole("button", { name: /^(Connect Wallet|Wallet verbinden)$/ }),
  );

describe("home page translations", () => {
  it("updates category filters, their accessible group name and empty states without refetching", async () => {
    mocks.query = "category=Payments";
    render(<HomePage />);
    expect(
      await screen.findByText("No active Payments contracts."),
    ).toBeTruthy();
    switchToGerman();
    expect(
      screen.getByRole("group", { name: "Nach Kategorie filtern" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Zahlungen" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByText("Keine aktiven Zahlungen-Vertr\u00e4ge."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Identit\u00e4t" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Spiele" }));
    expect(mocks.replace).toHaveBeenCalledWith("/?category=Gaming", {
      scroll: false,
    });
    expect(mocks.entries).toHaveBeenCalledTimes(1);
  });

  it("translates the Suspense fallback even while the content cannot mount", () => {
    mocks.suspend = true;
    render(<HomePage />);
    expect(screen.getByText("Loading registry\u2026")).toBeTruthy();
    switchToGerman();
    expect(screen.getByText("Registry wird geladen\u2026")).toBeTruthy();
  });

  it("updates an already displayed session recovery error", async () => {
    mocks.persisted.mockReturnValue({ address: "GTEST", walletId: "test" });
    mocks.session.mockRejectedValue(new Error("provider unavailable"));
    render(<HomePage />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Your saved wallet session could not be restored.",
    );
    switchToGerman();
    expect(screen.getByRole("alert").textContent).toContain(
      "Ihre gespeicherte Wallet-Sitzung konnte nicht wiederhergestellt werden.",
    );
    expect(mocks.session).toHaveBeenCalledTimes(1);
  });

  it("translates a connection exception and its retry hint", async () => {
    mocks.connect.mockRejectedValue(new Error("provider unavailable"));
    render(<HomePage />);
    connect();
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Could not connect to your wallet.",
    );
    switchToGerman();
    expect(screen.getByRole("alert").textContent).toContain(
      "Verbindung mit Ihrem Wallet konnte nicht hergestellt werden.",
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "\u00d6ffnen Sie Ihr Wallet",
    );
  });

  it("preserves provider error details inside a translated retry hint", async () => {
    mocks.connect.mockResolvedValue({ error: "Provider code 42" });
    setLocale("de");
    render(<HomePage />);
    connect();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Provider code 42");
    expect(alert.textContent).toContain("\u00d6ffnen Sie Ihr Wallet");
  });

  it("translates a network mismatch with the wallet and app network identifiers", async () => {
    mocks.connect.mockResolvedValue({ address: "GTEST" });
    mocks.session.mockResolvedValue({ address: "GTEST" });
    mocks.mismatch.mockResolvedValue({
      error: "English provider message",
      walletNetwork: "PUBLIC",
      appNetwork: "TESTNET",
    });
    render(<HomePage />);
    connect();
    await screen.findByRole("alert");
    switchToGerman();
    expect(screen.getByRole("alert").textContent).toContain(
      "Ihr Wallet verwendet PUBLIC, diese App jedoch TESTNET.",
    );
    expect(screen.getByRole("alert").textContent).not.toContain(
      "English provider message",
    );
  });

  it("updates a disconnect failure without losing the connected session", async () => {
    mocks.persisted.mockReturnValue({ address: "GTEST" });
    mocks.session.mockResolvedValue({ address: "GTEST" });
    mocks.disconnect.mockRejectedValue(new Error("provider unavailable"));
    render(<HomePage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Disconnect test wallet" }),
    );
    await screen.findByRole("alert");
    switchToGerman();
    expect(screen.getByRole("alert").textContent).toContain(
      "Ihr Wallet konnte nicht getrennt werden.",
    );
    expect(
      screen.getByRole("button", { name: "Disconnect test wallet" }),
    ).toBeTruthy();
  });
});
