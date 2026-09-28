// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TrustlineOp } from "@/lib/types";

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import AccountTrustlineTimeline from "./AccountTrustlineTimeline";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

function op(id: string, overrides: Partial<TrustlineOp> = {}): TrustlineOp {
  return {
    id,
    type: "CHANGE_TRUST",
    createdAt: new Date().toISOString(),
    transactionHash: `tx${id}`,
    sourceAccount: ADDRESS,
    asset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    amount: "1000000000",
    ...overrides,
  };
}

const count = (n: number, prefix = "tl") =>
  Array.from({ length: n }, (_, i) => op(`${prefix}${i}`));

function mockPage(items: TrustlineOp[], hasNextPage: boolean) {
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

describe("AccountTrustlineTimeline", () => {
  it("renders an empty state when the account has no trustline changes", () => {
    render(<AccountTrustlineTimeline address={ADDRESS} initial={[]} />);

    expect(
      screen.getByText("No trustline changes recorded for this account."),
    ).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("labels the seed as a sample when there may be more", async () => {
    render(<AccountTrustlineTimeline address={ADDRESS} initial={count(10)} />);

    expect(
      (await screen.findByTestId("trustline-count")).textContent,
    ).toBe("Showing 10 of recent trustline changes");
  });

  it("labels the complete list correctly for a single change", () => {
    render(<AccountTrustlineTimeline address={ADDRESS} initial={count(1)} />);

    expect(screen.getByTestId("trustline-count").textContent).toBe(
      "All 1 trustline change",
    );
  });

  it("labels the complete list correctly for multiple changes", () => {
    render(<AccountTrustlineTimeline address={ADDRESS} initial={count(3)} />);

    expect(screen.getByTestId("trustline-count").textContent).toBe(
      "All 3 trustline changes",
    );
  });

  it("shows the Set badge and trust limit for a normal trustline", () => {
    render(
      <AccountTrustlineTimeline
        address={ADDRESS}
        initial={[op("1", { asset: "USDC:GABC", amount: "1000000000" })]}
      />,
    );

    expect(screen.getByText("Set")).toBeTruthy();
    // The limit row should contain the formatted limit value
    expect(screen.getByText(/Limit:/)).toBeTruthy();
    expect(screen.getByText(/1,000,000,000 USDC/)).toBeTruthy();
  });

  it("shows the Removed badge and no limit line when amount is 0", () => {
    render(
      <AccountTrustlineTimeline
        address={ADDRESS}
        initial={[op("1", { asset: "USDC:GABC", amount: "0" })]}
      />,
    );

    expect(screen.getByText("Removed")).toBeTruthy();
    expect(screen.queryByText(/Limit:/)).toBeNull();
  });

  it("shows the Removed badge when amount is null", () => {
    render(
      <AccountTrustlineTimeline
        address={ADDRESS}
        initial={[op("1", { asset: "USDC:GABC", amount: null })]}
      />,
    );

    expect(screen.getByText("Removed")).toBeTruthy();
    expect(screen.queryByText(/Limit:/)).toBeNull();
  });

  it("renders the asset code and a truncated issuer", () => {
    const issuer = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
    render(
      <AccountTrustlineTimeline
        address={ADDRESS}
        initial={[op("1", { asset: `USDC:${issuer}` })]}
      />,
    );

    expect(screen.getByText("USDC")).toBeTruthy();
    // Issuer should be truncated — not shown in full
    expect(screen.queryByText(issuer)).toBeNull();
  });

  it("links each entry to its transaction on stellar.expert", () => {
    render(
      <AccountTrustlineTimeline
        address={ADDRESS}
        initial={[op("1", { transactionHash: "abc123" })]}
      />,
    );

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(
      "https://stellar.expert/explorer/public/tx/abc123",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("follows the cursor, accumulating pages without duplicating the seed", async () => {
    mockPage(count(25), true);
    render(<AccountTrustlineTimeline address={ADDRESS} initial={count(10)} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /load more/i }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("trustline-count").textContent).toBe(
        "Showing 25 of recent trustline changes",
      ),
    );
    expect(gqlFetch.mock.calls[0][2]).toMatchObject({
      address: ADDRESS,
      limit: 25,
      cursor: null,
    });

    mockPage(count(25, "p2"), false);
    await userEvent.click(screen.getByRole("button", { name: /load more/i }));

    await waitFor(() =>
      expect(screen.getByTestId("trustline-count").textContent).toBe(
        "All 50 trustline changes",
      ),
    );
    expect(gqlFetch.mock.calls[1][2]).toMatchObject({
      address: ADDRESS,
      limit: 25,
      cursor: "cursor-2",
    });
    expect(screen.getByText("End of trustline history")).toBeTruthy();
  });

  it("offers a retry when a page fails to load", async () => {
    gqlFetch.mockRejectedValue(new Error("GraphQL request failed (502)"));
    render(<AccountTrustlineTimeline address={ADDRESS} initial={count(10)} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /load more/i }),
    );

    expect(
      await screen.findByText("Could not load more trustline history."),
    ).toBeTruthy();

    mockPage(count(25), false);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByTestId("trustline-count").textContent).toBe(
        "All 25 trustline changes",
      ),
    );
  });

  it("never applies a page requested for a previous account", async () => {
    let settle!: (page: unknown) => void;
    gqlFetch.mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );

    const { rerender } = render(
      <AccountTrustlineTimeline address={ADDRESS} initial={count(10)} />,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /load more/i }),
    );
    expect(gqlFetch).toHaveBeenCalledTimes(1);

    // Navigating to a different account cancels the in-flight request.
    rerender(
      <AccountTrustlineTimeline
        address="GOTHERACCOUNT234567ABCDEFGHIJKLMNOPQRSTUV"
        initial={count(10)}
      />,
    );
    expect(gqlFetch.mock.calls[0][3].signal.aborted).toBe(true);

    // Even if the response lands it must not populate the new account's list.
    await act(async () => {
      settle({
        operations: {
          items: count(25, "stale"),
          pageInfo: { hasNextPage: false, cursor: null },
        },
      });
    });

    // The new account still shows only its own 10-item seed.
    expect(screen.getByTestId("trustline-count").textContent).toBe(
      "Showing 10 of recent trustline changes",
    );
  });
});
