// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Account } from "@/lib/types";

const cookieMap = new Map<string, string>();
const headerMap = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieMap.has(name) ? { name, value: cookieMap.get(name)! } : undefined,
  })),
  headers: vi.fn(async () => ({
    get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
  })),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
    clearAll: vi.fn(),
    toasts: [],
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const gqlFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import AccountPage from "./page";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

function mockAccount(overrides: Partial<Account> = {}): Account {
  return {
    address: ADDRESS,
    sequence: "12345678",
    subentryCount: 3,
    lastModifiedLedger: 51999000,
    numSponsored: 1,
    numSponsoring: 2,
    balances: [
      {
        assetType: "native",
        assetCode: null,
        assetIssuer: null,
        balance: "100.5000000",
        limit: null,
      },
      {
        assetType: "credit_alphanum4",
        assetCode: "USDC",
        assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        balance: "50.0000000",
        limit: "1000.0000000",
      },
    ],
    flags: {
      authRequired: true,
      authRevocable: false,
      authImmutable: false,
      authClawbackEnabled: false,
    },
    transactions: [],
    operations: [],
    ...overrides,
  };
}

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

describe("AccountPage i18n translations", () => {
  beforeEach(() => {
    cookieMap.clear();
    headerMap.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the account detail page in English by default", async () => {
    respond({
      AccountDetail: { account: mockAccount() },
      AccountTrades: { trades: { items: [] } },
      AccountTrustlineOps: { operations: { items: [] } },
      AccountLifecycle: { accountLifecycle: null },
    });

    const jsx = await AccountPage({
      params: Promise.resolve({ address: ADDRESS }),
    });
    render(jsx);

    // Breadcrumbs
    expect(screen.getByText("Explorer")).toBeTruthy();
    expect(screen.getByText("Accounts")).toBeTruthy();

    // Headings
    expect(screen.getByRole("heading", { name: "Balances" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Recent Transactions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Trades" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Recent Operations" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Trustline History" }),
    ).toBeTruthy();

    // Stats
    expect(screen.getByText("Sequence")).toBeTruthy();
    expect(screen.getByText("Subentries")).toBeTruthy();
    expect(screen.getByText("Sponsoring")).toBeTruthy();
    expect(screen.getByText("Sponsored")).toBeTruthy();

    // Balances table headers & aria
    expect(
      screen.getByRole("region", { name: "Account balances" }),
    ).toBeTruthy();
    expect(screen.getByText("Asset")).toBeTruthy();
    expect(screen.getByText("Issuer")).toBeTruthy();
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText("Limit")).toBeTruthy();

    // Flags
    expect(screen.getByText("Auth Required")).toBeTruthy();

    // Last modified ledger
    expect(screen.getByText("Last modified at ledger 51,999,000")).toBeTruthy();
  });

  it("renders the account detail page in German when locale cookie is set", async () => {
    cookieMap.set("lumina-locale", "de");

    respond({
      AccountDetail: {
        account: mockAccount({
          flags: {
            authRequired: false,
            authRevocable: false,
            authImmutable: false,
            authClawbackEnabled: false,
          },
        }),
      },
      AccountTrades: { trades: { items: [] } },
      AccountTrustlineOps: { operations: { items: [] } },
      AccountLifecycle: {
        accountLifecycle: { mergedIntoAddress: "GDESTINATION..." },
      },
    });

    const jsx = await AccountPage({
      params: Promise.resolve({ address: ADDRESS }),
    });
    render(jsx);

    // Breadcrumbs in German
    expect(screen.getByText("Explorer")).toBeTruthy();
    expect(screen.getByText("Konten")).toBeTruthy();

    // Merged badge in German
    expect(screen.getByText("Zusammengeführt")).toBeTruthy();

    // Headings in German
    expect(screen.getByRole("heading", { name: "Guthaben" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Letzte Transaktionen" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Handel" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Letzte Operationen" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Trustline-Verlauf" }),
    ).toBeTruthy();

    // Stats in German
    expect(screen.getByText("Sequenz")).toBeTruthy();
    expect(screen.getByText("Unterpositionen")).toBeTruthy();
    expect(screen.getByText("Sponsoring")).toBeTruthy();
    expect(screen.getByText("Gesponsert")).toBeTruthy();

    // Balances table headers & aria in German
    expect(screen.getByRole("region", { name: "Kontoguthaben" })).toBeTruthy();
    expect(screen.getByText("Vermögenswert")).toBeTruthy();
    expect(screen.getByText("Emittent")).toBeTruthy();
    expect(screen.getByText("Saldo")).toBeTruthy();
    expect(screen.getByText("Limit")).toBeTruthy();

    // Default flag tag in German
    expect(screen.getByText("Keine besonderen Flags")).toBeTruthy();

    // Last modified ledger in German
    expect(
      screen.getByText("Zuletzt geändert bei Ledger 51,999,000"),
    ).toBeTruthy();
  });

  it("renders not-found state in English and German", async () => {
    respond({
      AccountDetail: { account: null },
      AccountTrades: { trades: { items: [] } },
      AccountTrustlineOps: { operations: { items: [] } },
      AccountLifecycle: { accountLifecycle: null },
    });

    // 1. English
    const jsxEn = await AccountPage({
      params: Promise.resolve({ address: ADDRESS }),
    });
    const { unmount } = render(jsxEn);
    expect(screen.getByText("Account Not Found")).toBeTruthy();
    expect(
      screen.getByText(
        /does not exist on Stellar Mainnet, or has never been funded/,
      ),
    ).toBeTruthy();
    unmount();

    // 2. German
    cookieMap.set("lumina-locale", "de");
    const jsxDe = await AccountPage({
      params: Promise.resolve({ address: ADDRESS }),
    });
    render(jsxDe);
    expect(screen.getByText("Konto nicht gefunden")).toBeTruthy();
    expect(
      screen.getByText(
        /existiert nicht im Stellar-Mainnet oder wurde noch nie aufgeladen/,
      ),
    ).toBeTruthy();
  });

  it("renders unavailable alerts in English and German when sub-queries fail", async () => {
    respond({
      AccountDetail: { account: mockAccount() },
      AccountTrades: new Error("Network error"),
      AccountTrustlineOps: new Error("Network error"),
      AccountLifecycle: { accountLifecycle: null },
    });

    // 1. English
    const jsxEn = await AccountPage({
      params: Promise.resolve({ address: ADDRESS }),
    });
    const { unmount } = render(jsxEn);
    expect(
      screen.getByText(
        "Trade history is unavailable. Check your connection and refresh this page to try again.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Trustline history is unavailable. Check your connection and refresh this page to try again.",
      ),
    ).toBeTruthy();
    unmount();

    // 2. German
    cookieMap.set("lumina-locale", "de");
    const jsxDe = await AccountPage({
      params: Promise.resolve({ address: ADDRESS }),
    });
    render(jsxDe);
    expect(
      screen.getByText(
        "Handelsverlauf ist nicht verfügbar. Überprüfen Sie Ihre Verbindung und aktualisieren Sie diese Seite, um es erneut zu versuchen.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Trustline-Verlauf ist nicht verfügbar. Überprüfen Sie Ihre Verbindung und aktualisieren Sie diese Seite, um es erneut zu versuchen.",
      ),
    ).toBeTruthy();
  });
});
