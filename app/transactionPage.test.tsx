// @vitest-environment jsdom
/**
 * The transaction detail page: one transaction by hash, its operations, and
 * the two states that are not the happy path — a hash the indexer has never
 * seen, and an indexer that cannot be reached.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

// `BackendUnavailable` navigates on retry; the stub keeps it renderable
// outside a router context.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import TransactionPage from "./transactions/[hash]/page";

const HASH = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const SOURCE = "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY";
const UNREACHABLE = new Error("GraphQL request failed (502)");

/** Render an async server component. */
async function renderPage(element: Promise<React.ReactElement>) {
  return render(await element);
}

beforeEach(() => {
  gqlFetch.mockReset();
});

afterEach(cleanup);

describe("TransactionPage", () => {
  it("renders a transaction from a known response", async () => {
    gqlFetch.mockResolvedValue({
      transaction: {
        hash: HASH,
        ledger: 500,
        createdAt: new Date().toISOString(),
        sourceAccount: SOURCE,
        feeCharged: "1000000",
        operationCount: 1,
        successful: true,
        memoType: "text",
        memo: "order 12345",
        operations: [
          {
            id: "op-1",
            type: "PAYMENT",
            createdAt: new Date().toISOString(),
            sourceAccount: SOURCE,
            from: SOURCE,
            to: "GDESTINATIONAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            amount: "10.0000000",
            asset: "XLM",
          },
        ],
      },
    });

    await renderPage(
      TransactionPage({ params: Promise.resolve({ hash: HASH }) }),
    );

    expect(gqlFetch.mock.calls[0][2]).toMatchObject({ hash: HASH });
    expect(screen.getByText("Successful")).toBeTruthy();
    expect(screen.getByText("order 12345")).toBeTruthy();
    expect(screen.getByText("Payment")).toBeTruthy();
    expect(screen.getByText("10.00 XLM")).toBeTruthy();
  });

  it("renders a not-found state for an unknown hash rather than throwing", async () => {
    gqlFetch.mockResolvedValue({ transaction: null });

    await renderPage(
      TransactionPage({ params: Promise.resolve({ hash: HASH }) }),
    );

    expect(screen.getByText(/transaction not found/i)).toBeTruthy();
  });

  it("renders rather than crashing when the API is unreachable", async () => {
    gqlFetch.mockRejectedValue(UNREACHABLE);

    await renderPage(
      TransactionPage({ params: Promise.resolve({ hash: HASH }) }),
    );

    expect(screen.getByText(/temporarily unavailable/i)).toBeTruthy();
  });

  it("links the source account to its account page", async () => {
    gqlFetch.mockResolvedValue({
      transaction: {
        hash: HASH,
        ledger: 500,
        createdAt: new Date().toISOString(),
        sourceAccount: SOURCE,
        feeCharged: "1000000",
        operationCount: 0,
        successful: false,
        memoType: null,
        memo: null,
        operations: [],
      },
    });

    await renderPage(
      TransactionPage({ params: Promise.resolve({ hash: HASH }) }),
    );

    const link = screen.getByRole("link", { name: SOURCE });
    expect(link).toHaveAttribute("href", `/accounts/${SOURCE}`);
  });
});
