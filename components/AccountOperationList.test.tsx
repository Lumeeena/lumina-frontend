// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Operation } from "@/lib/types";

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import AccountOperationList from "./AccountOperationList";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

function op(id: string): Operation {
  return {
    id,
    type: "PAYMENT",
    createdAt: new Date().toISOString(),
    transactionHash: `tx${id}`,
    sourceAccount: ADDRESS,
    from: ADDRESS,
    to: null,
    amount: "5",
    asset: "XLM",
    startingBalance: null,
    funder: null,
    offerId: null,
    price: null,
    selling: null,
    buying: null,
  };
}

const count = (n: number, prefix = "op") =>
  Array.from({ length: n }, (_, i) => op(`${prefix}${i}`));

/** Stub the one query the list makes: operations(account:, limit:, cursor:). */
function mockOperationPage(items: Operation[], hasNextPage: boolean) {
  gqlFetch.mockResolvedValue({
    operations: {
      items,
      pageInfo: { hasNextPage, cursor: hasNextPage ? "cursor-2" : null },
    },
  });
}

beforeEach(() => {
  gqlFetch.mockReset();
});

afterEach(cleanup);

describe("AccountOperationList", () => {
  it("labels the seed as a sample, not the whole history", async () => {
    render(<AccountOperationList address={ADDRESS} initial={count(10)} />);

    expect((await screen.findByTestId('operation-count')).textContent).toBe(
      'Showing 10 of your recent operations'
    );
  });

  it('follows the cursor, accumulating pages without duplicating the seed', async () => {
    // First client page (limit 25) covers the 10-row seed — same ids, newest
    // first — so the seed is deduped rather than repeated.
    mockOperationPage(count(25), true);
    render(<AccountOperationList address={ADDRESS} initial={count(10)} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /load more/i }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('operation-count').textContent).toBe(
        'Showing 25 of your recent operations'
      )
    );
    expect(gqlFetch.mock.calls[0][2]).toMatchObject({
      address: ADDRESS,
      limit: 25,
      cursor: null,
    });

    mockOperationPage(count(25, "p2"), false);
    await userEvent.click(screen.getByRole("button", { name: /load more/i }));

    await waitFor(() =>
      expect(screen.getByTestId('operation-count').textContent).toBe('All 50 operations')
    );
    expect(gqlFetch.mock.calls[1][2]).toMatchObject({
      address: ADDRESS,
      limit: 25,
      cursor: "cursor-2",
    });
    expect(screen.getByText("End of results")).toBeTruthy();
  });

  it("says so when the account has nothing older", async () => {
    render(<AccountOperationList address={ADDRESS} initial={count(3)} />);

    expect((await screen.findByTestId('operation-count')).textContent).toBe('All 3 operations');
  });

  it("offers a retry when a page fails to load", async () => {
    gqlFetch.mockRejectedValue(new Error("GraphQL request failed (502)"));
    render(<AccountOperationList address={ADDRESS} initial={count(10)} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /load more/i }),
    );

    expect(
      await screen.findByText("Could not load more operations."),
    ).toBeTruthy();

    mockOperationPage(count(25), false);
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByTestId('operation-count').textContent).toBe('All 25 operations')
    );
  });

  it("renders an empty state instead of an empty table", () => {
    render(<AccountOperationList address={ADDRESS} initial={[]} />);

    expect(screen.getByText("No operations yet.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
