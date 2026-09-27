// @vitest-environment jsdom
/**
 * The memo search results page: what it renders for a query, for no query at
 * all, and when the indexer is unreachable.
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

import SearchPage from "./search/page";

const UNREACHABLE = new Error("GraphQL request failed (502)");

function tx(hash: string, memo: string | null) {
  return {
    hash,
    ledger: 500,
    createdAt: new Date().toISOString(),
    sourceAccount: "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY",
    feeCharged: "1000000",
    operationCount: 1,
    successful: true,
    memoType: memo ? "text" : null,
    memo,
  };
}

/** Render an async server component. */
async function renderPage(element: Promise<React.ReactElement>) {
  return render(await element);
}

beforeEach(() => {
  gqlFetch.mockReset();
});

afterEach(cleanup);

describe("SearchPage", () => {
  it("queries the backend memo search with the trimmed query", async () => {
    gqlFetch.mockResolvedValue({ search: { items: [] } });

    await renderPage(
      SearchPage({ searchParams: Promise.resolve({ q: "  order 12345  " }) }),
    );

    expect(gqlFetch.mock.calls[0][2]).toMatchObject({ query: "order 12345" });
  });

  it("renders the matching transactions", async () => {
    gqlFetch.mockResolvedValue({
      search: {
        items: [
          tx("a".repeat(64), "order 12345"),
          tx("b".repeat(64), "order 12345-2"),
        ],
      },
    });

    await renderPage(
      SearchPage({ searchParams: Promise.resolve({ q: "order 12345" }) }),
    );

    expect(screen.getByText(/2 transactions matching/)).toBeTruthy();
    expect(screen.getByText("“order 12345”")).toBeTruthy();
    // Two result rows, one per matching transaction.
    expect(screen.getAllByTitle("a".repeat(64))).toBeTruthy();
    expect(screen.getAllByTitle("b".repeat(64))).toBeTruthy();
  });

  it("shows an empty state when nothing matches", async () => {
    gqlFetch.mockResolvedValue({ search: { items: [] } });

    await renderPage(
      SearchPage({
        searchParams: Promise.resolve({ q: "nothing matches this" }),
      }),
    );

    expect(screen.getByText(/no transactions carry/i)).toBeTruthy();
  });

  it("explains the four searchable shapes when no query is given", async () => {
    await renderPage(SearchPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Search",
    );
    expect(screen.getByText("Account address")).toBeTruthy();
    expect(screen.getByText(/contract id/i)).toBeTruthy();
    expect(screen.getByText("Transaction hash")).toBeTruthy();
    expect(screen.getByText(/memo search/i)).toBeTruthy();
    // No query, no request.
    expect(gqlFetch).not.toHaveBeenCalled();
  });

  it("renders rather than crashing when the API is unreachable", async () => {
    gqlFetch.mockRejectedValue(UNREACHABLE);

    await renderPage(
      SearchPage({ searchParams: Promise.resolve({ q: "order 12345" }) }),
    );

    expect(screen.getByText(/temporarily unavailable/i)).toBeTruthy();
  });
});
