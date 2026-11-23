import { describe, expect, it } from "vitest";
import {
  buildOrderBook,
  formatDecimal,
  parseDecimal,
  type OrderBookLevel,
} from "./orderBook";

describe("parseDecimal", () => {
  it("reads whole and fractional amounts as stroops", () => {
    expect(parseDecimal("1.5")).toBe(BigInt(15000000));
    expect(parseDecimal("10")).toBe(BigInt(100000000));
    expect(parseDecimal("0.0000001")).toBe(BigInt(1));
  });

  it("trims surrounding whitespace", () => {
    expect(parseDecimal(" 2 ")).toBe(BigInt(20000000));
  });

  it("rejects anything that is not a non-negative decimal with at most seven places", () => {
    for (const bad of [
      "1.00000001",
      "-1",
      "abc",
      "",
      "1.",
      ".5",
      "1e3",
    ]) {
      expect(parseDecimal(bad)).toBeNull();
    }
  });
});

describe("formatDecimal", () => {
  it("renders stroops with trailing zeros removed", () => {
    expect(formatDecimal(BigInt(15000000))).toBe("1.5");
    expect(formatDecimal(BigInt(100000000))).toBe("10");
    expect(formatDecimal(BigInt(1))).toBe("0.0000001");
    expect(formatDecimal(BigInt(0))).toBe("0");
  });

  it("round-trips the largest amounts Stellar can represent without loss", () => {
    const amount = "922337203685.4775807";
    expect(formatDecimal(parseDecimal(amount) ?? BigInt(0))).toBe(amount);
  });
});

describe("buildOrderBook", () => {
  const bids: OrderBookLevel[] = [
    { price: "1.2", amount: "10" },
    { price: "1.3", amount: "5" },
    { price: "1.1", amount: "2" },
  ];
  const asks: OrderBookLevel[] = [
    { price: "1.5", amount: "4" },
    { price: "1.4", amount: "3" },
  ];

  it("orders bids from the highest price and asks from the lowest", () => {
    const book = buildOrderBook(bids, asks);
    expect(book.bids.map((row) => row.price)).toEqual(["1.3", "1.2", "1.1"]);
    expect(book.asks.map((row) => row.price)).toEqual(["1.4", "1.5"]);
  });

  it("accumulates depth outward from the best price on each side", () => {
    const book = buildOrderBook(bids, asks);
    expect(book.bids.map((row) => row.total)).toEqual(["5", "15", "17"]);
    expect(book.asks.map((row) => row.total)).toEqual(["3", "7"]);
  });

  it("sizes each depth bar against the deepest total on its side", () => {
    const book = buildOrderBook(bids, asks);
    // 5/17, 15/17 and 17/17 of the bid side; 3/7 and 7/7 of the ask side.
    expect(book.bids.map((row) => row.depth)).toEqual([29, 88, 100]);
    expect(book.asks.map((row) => row.depth)).toEqual([42, 100]);
  });

  it("reports the best prices and the spread between them", () => {
    const book = buildOrderBook(bids, asks);
    expect(book.bestBid).toBe("1.3");
    expect(book.bestAsk).toBe("1.4");
    expect(book.spread).toBe("0.1");
    expect(book.isEmpty).toBe(false);
  });

  it("keeps totals exact where summing JavaScript numbers would drift", () => {
    const book = buildOrderBook(
      [],
      [
        { price: "1", amount: "0.1" },
        { price: "2", amount: "0.1" },
        { price: "3", amount: "0.1" },
      ],
    );
    expect(book.asks.map((row) => row.total)).toEqual(["0.1", "0.2", "0.3"]);
  });

  it("merges offers that share a price into one level", () => {
    const book = buildOrderBook(
      [
        { price: "1.0", amount: "1.5" },
        { price: "1", amount: "2.5" },
      ],
      [],
    );
    expect(book.bids).toEqual([
      { price: "1", amount: "4", total: "4", depth: 100 },
    ]);
  });

  it("drops malformed and zero-size levels instead of showing them", () => {
    const book = buildOrderBook(
      [
        { price: "abc", amount: "1" },
        { price: "2", amount: "0" },
        { price: "2", amount: "1" },
      ],
      [],
    );
    expect(book.bids).toEqual([
      { price: "2", amount: "1", total: "1", depth: 100 },
    ]);
  });

  it("reports an empty book as empty with no prices or spread", () => {
    expect(buildOrderBook([], [])).toEqual({
      bids: [],
      asks: [],
      isEmpty: true,
      bestBid: null,
      bestAsk: null,
      spread: null,
    });
  });

  it("does not report a spread when one side has no offers", () => {
    const book = buildOrderBook(bids, []);
    expect(book.isEmpty).toBe(false);
    expect(book.bestAsk).toBeNull();
    expect(book.spread).toBeNull();
  });

  it("does not report a negative spread for a crossed book", () => {
    const book = buildOrderBook(
      [{ price: "2", amount: "1" }],
      [{ price: "1", amount: "1" }],
    );
    expect(book.spread).toBeNull();
  });
});
