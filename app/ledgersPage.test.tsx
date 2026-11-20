// @vitest-environment jsdom
/**
 * The ledgers listing (#375): one server-rendered page of `ledgers`, newest
 * first, walked with the API's cursor.
 *
 * What a reader would notice going wrong: a "next" link that loses its place,
 * an end-of-walk page that claims nothing is indexed, and a stretch of missing
 * ledgers that the table silently skips over.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

// `BackendUnavailable` calls `useRouter().refresh()` when no `onRetry` is given.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

import LedgersPage, { metadata } from "./ledgers/page";
import { LEDGERS } from "@/lib/routes";

function ledger(sequence: number) {
  return {
    sequence,
    closedAt: "2026-11-20T12:00:00Z",
    transactionCount: sequence % 100,
    operationCount: (sequence % 100) * 2,
  };
}

function respond(
  sequences: number[],
  pageInfo: { hasNextPage: boolean; cursor: string | null } = {
    hasNextPage: false,
    cursor: null,
  },
) {
  gqlFetch.mockResolvedValue({
    ledgers: { items: sequences.map(ledger), pageInfo },
  });
}

async function renderPage(searchParams: { cursor?: string } = {}) {
  return render(
    await LedgersPage({ searchParams: Promise.resolve(searchParams) }),
  );
}

// A block body, not `() => gqlFetch.mockReset()`: `mockReset` returns the mock,
// and vitest runs a function returned from `beforeEach` as the test's teardown.
beforeEach(() => {
  gqlFetch.mockReset();
});
afterEach(cleanup);

describe("LedgersPage", () => {
  it("lists each ledger's sequence, close time and counts, linked to its page", async () => {
    respond([1234567, 1234566]);
    await renderPage();

    // Plain selectors rather than role queries: role queries are slow in jsdom
    // and this test inspects every cell.
    const rows = screen.getByRole("table").querySelectorAll("tbody tr");
    // One row per ledger, newest first as the API returned them.
    expect(rows).toHaveLength(2);
    const cells = Array.from(rows[0].querySelectorAll("td"));
    const link = cells[0].querySelector("a");
    expect(link?.textContent).toBe("1234567");
    expect(link?.getAttribute("href")).toBe("/ledgers/1234567");
    expect(cells[1].querySelector("time")?.getAttribute("datetime")).toBe(
      "2026-11-20T12:00:00Z",
    );
    expect(cells[2].textContent).toBe("67");
    expect(cells[3].textContent).toBe("134");
    expect(rows[1].querySelector("a")?.getAttribute("href")).toBe(
      "/ledgers/1234566",
    );
    expect(screen.getByText("Showing 2 ledgers")).toBeTruthy();
  });

  it("asks for the first page when no cursor is given", async () => {
    respond([10]);
    await renderPage();

    expect(gqlFetch.mock.calls[0][2]).toEqual({ limit: 25, cursor: null });
  });

  it("links to the next page with the API's own cursor", async () => {
    respond([300, 299], { hasNextPage: true, cursor: "abc+/=" });
    await renderPage();

    const older = screen.getByRole("link", { name: /Older/ });
    // Encoded, so a cursor carrying URL syntax survives the round trip.
    expect(older.getAttribute("href")).toBe("/ledgers?cursor=abc%2B%2F%3D");
    // Already on the newest page, so there is nowhere newer to go.
    expect(screen.queryByRole("link", { name: /Newest/ })).toBeNull();
  });

  it("resumes from the cursor in the URL and offers a way back", async () => {
    respond([200], { hasNextPage: true, cursor: "next" });
    await renderPage({ cursor: "prev" });

    expect(gqlFetch.mock.calls[0][2]).toEqual({ limit: 25, cursor: "prev" });
    expect(
      screen.getByRole("link", { name: /Newest/ }).getAttribute("href"),
    ).toBe("/ledgers");
  });

  it("stops offering more once the API says there is no next page", async () => {
    respond([5, 4], { hasNextPage: false, cursor: "end" });
    await renderPage({ cursor: "prev" });

    expect(screen.queryByRole("link", { name: /Older/ })).toBeNull();
  });

  it("does not offer a next page without a cursor to follow", async () => {
    respond([5, 4], { hasNextPage: true, cursor: null });
    await renderPage();

    expect(screen.queryByRole("link", { name: /Older/ })).toBeNull();
  });

  it("calls out a stretch of missing ledgers between the rows", async () => {
    respond([1000, 999, 990, 989]);
    await renderPage();

    expect(screen.getByText("Incomplete Indexing")).toBeTruthy();
    expect(screen.getByText(/ledgers\s+991 to\s+998/)).toBeTruthy();
  });

  it("shows no gap notice for a contiguous page", async () => {
    respond([1000, 999, 998]);
    await renderPage();

    expect(screen.queryByText("Incomplete Indexing")).toBeNull();
  });

  it("says the index is empty on the first page", async () => {
    respond([]);
    await renderPage();

    expect(screen.getByText(/No ledgers indexed yet/)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("reports the end of the walk, not an empty index, after a cursor", async () => {
    // An empty page after a cursor is how the API says the walk is finished.
    respond([], { hasNextPage: false, cursor: null });
    await renderPage({ cursor: "last" });

    expect(screen.getByText("No older ledgers are indexed.")).toBeTruthy();
    expect(screen.queryByText(/No ledgers indexed yet/)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: /Back to the newest ledgers/ })
        .getAttribute("href"),
    ).toBe("/ledgers");
  });

  it("falls back to the unavailable state when the API cannot be reached", async () => {
    gqlFetch.mockRejectedValue(new Error("GraphQL request failed (502)"));
    await renderPage();

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/temporarily unavailable/i)).toBeTruthy();
  });

  it("takes its title and description from the route inventory", () => {
    expect(metadata.title).toBe(LEDGERS.label);
    expect(metadata.description).toBe(LEDGERS.description);
    expect(metadata.alternates?.canonical).toBe(LEDGERS.path);
  });
});
