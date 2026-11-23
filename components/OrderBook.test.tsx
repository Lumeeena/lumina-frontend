// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { buildOrderBook } from "@/lib/orderBook";
import OrderBook from "./OrderBook";

afterEach(cleanup);

const PAIR = "XLM / USDC";

describe("OrderBook", () => {
  it("explains an empty book instead of rendering empty tables", () => {
    render(<OrderBook view={buildOrderBook([], [])} pairLabel={PAIR} />);

    expect(screen.getByRole("status").textContent).toContain(
      "No open offers for XLM / USDC yet.",
    );
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders bids and asks with cumulative totals and the spread", () => {
    const view = buildOrderBook(
      [
        { price: "1.2", amount: "10" },
        { price: "1.3", amount: "5" },
      ],
      [{ price: "1.4", amount: "3" }],
    );
    render(<OrderBook view={view} pairLabel={PAIR} />);

    const bids = within(screen.getByRole("table", { name: "Bids for XLM / USDC" }));
    expect(bids.getByRole("columnheader", { name: "Bid price" })).toBeTruthy();
    expect(bids.getByText("1.3")).toBeTruthy();
    expect(bids.getByText("15")).toBeTruthy();

    const asks = within(screen.getByRole("table", { name: "Asks for XLM / USDC" }));
    expect(asks.getByText("1.4")).toBeTruthy();

    expect(screen.getByText("0.1")).toBeTruthy();
  });

  it("sizes the deepest level's bar to the full width", () => {
    const view = buildOrderBook(
      [
        { price: "1.3", amount: "5" },
        { price: "1.2", amount: "10" },
      ],
      [],
    );
    const { container } = render(<OrderBook view={view} pairLabel={PAIR} />);

    expect(container.querySelector('span[style="width: 100%;"]')).not.toBeNull();
  });

  it("marks a side with no offers instead of hiding it", () => {
    const view = buildOrderBook([{ price: "1.3", amount: "5" }], []);
    render(<OrderBook view={view} pairLabel={PAIR} />);

    expect(screen.getByText("No asks yet.")).toBeTruthy();
    expect(screen.queryByText("No bids yet.")).toBeNull();
    expect(screen.getByRole("table", { name: "Bids for XLM / USDC" })).toBeTruthy();
  });

  it("shows no spread when the book has offers on only one side", () => {
    const view = buildOrderBook([{ price: "1.3", amount: "5" }], []);
    render(<OrderBook view={view} pairLabel={PAIR} />);

    const spread = screen.getByText("Spread").parentElement;
    expect(spread?.textContent).toContain("—");
  });
});
