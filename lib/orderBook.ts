/**
 * Depth for one DEX order book: bids and asks with cumulative totals (#196).
 *
 * Stellar amounts and prices are decimal strings with at most seven places,
 * because the protocol counts in stroops (10^-7). Everything here runs on
 * bigint stroops, so a running total never picks up the rounding error that
 * summing JavaScript numbers would (0.1 + 0.1 + 0.1 is not 0.3 in floats).
 */

export const STROOP_DECIMALS = 7;
// The project targets ES2017, where bigint literals (`0n`) are not allowed, so
// the constants are built with BigInt(...) calls instead.
const ZERO = BigInt(0);
const HUNDRED = BigInt(100);
const STROOPS_PER_UNIT = BigInt(10) ** BigInt(STROOP_DECIMALS);
const DECIMAL_PATTERN = /^(\d+)(?:\.(\d{1,7}))?$/;

/** One price level as the backend reports it. */
export interface OrderBookLevel {
  price: string;
  amount: string;
}

/** A level with its running total from the best price outward. */
export interface DepthRow {
  price: string;
  amount: string;
  /** Cumulative amount from the best price through this level. */
  total: string;
  /** Share of the side's deepest total, 0-100, for sizing a depth bar. */
  depth: number;
}

export interface OrderBookView {
  /** Highest price first. */
  bids: DepthRow[];
  /** Lowest price first. */
  asks: DepthRow[];
  /** True when neither side has a usable level: an empty book, not an error. */
  isEmpty: boolean;
  bestBid: string | null;
  bestAsk: string | null;
  /** Best ask minus best bid, or null when either side is empty. */
  spread: string | null;
}

/**
 * Parse a non-negative decimal with at most seven places into stroops.
 * Returns null for anything else, so a malformed level is dropped rather than
 * turned into a wrong number.
 */
export function parseDecimal(value: string): bigint | null {
  const match = DECIMAL_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, whole, fraction = ""] = match;
  const padded = (fraction + "0".repeat(STROOP_DECIMALS)).slice(
    0,
    STROOP_DECIMALS,
  );
  return BigInt(whole) * STROOPS_PER_UNIT + BigInt(padded);
}

/** Render stroops as the shortest decimal string that is still exact. */
export function formatDecimal(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_UNIT;
  const fraction = (stroops % STROOPS_PER_UNIT)
    .toString()
    .padStart(STROOP_DECIMALS, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

interface ParsedLevel {
  price: bigint;
  amount: bigint;
}

function parseLevels(levels: OrderBookLevel[]): ParsedLevel[] {
  const parsed: ParsedLevel[] = [];
  for (const level of levels) {
    const price = parseDecimal(level.price);
    const amount = parseDecimal(level.amount);
    // Zero-size levels carry no depth; dropping them keeps the table honest.
    if (price === null || amount === null || price === ZERO || amount === ZERO) {
      continue;
    }
    parsed.push({ price, amount });
  }
  return parsed;
}

/**
 * Merge levels that share a price (the backend may report one offer per row),
 * then order them from the best price outward and attach running totals.
 */
function buildSide(
  levels: OrderBookLevel[],
  direction: "bid" | "ask",
): DepthRow[] {
  const byPrice = new Map<bigint, bigint>();
  for (const level of parseLevels(levels)) {
    byPrice.set(level.price, (byPrice.get(level.price) ?? ZERO) + level.amount);
  }

  const ordered = [...byPrice.entries()].sort(([a], [b]) =>
    a === b ? 0 : direction === "bid" ? (a > b ? -1 : 1) : a < b ? -1 : 1,
  );

  const rows: Array<{ price: bigint; amount: bigint; total: bigint }> = [];
  let running = ZERO;
  for (const [price, amount] of ordered) {
    running += amount;
    rows.push({ price, amount, total: running });
  }

  const deepest = running;
  return rows.map((row) => ({
    price: formatDecimal(row.price),
    amount: formatDecimal(row.amount),
    total: formatDecimal(row.total),
    // Integer percentage: the bar only needs to be visually proportional.
    depth: deepest === ZERO ? 0 : Number((row.total * HUNDRED) / deepest),
  }));
}

/**
 * Build the view for an order book. Bids are the offers to buy the base asset
 * and asks the offers to sell it; each side is ordered from its best price.
 */
export function buildOrderBook(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
): OrderBookView {
  const bidRows = buildSide(bids, "bid");
  const askRows = buildSide(asks, "ask");

  const bestBid = bidRows[0]?.price ?? null;
  const bestAsk = askRows[0]?.price ?? null;

  // Both sides were formatted from stroops, so parsing them back cannot fail;
  // the null checks keep the types honest without an assertion.
  const askStroops = bestAsk === null ? null : parseDecimal(bestAsk);
  const bidStroops = bestBid === null ? null : parseDecimal(bestBid);
  let spread: string | null = null;
  if (askStroops !== null && bidStroops !== null) {
    const difference = askStroops - bidStroops;
    // A crossed book (best bid above best ask) should not occur on the DEX; it
    // is reported as no spread rather than as a negative one.
    if (difference >= ZERO) spread = formatDecimal(difference);
  }

  return {
    bids: bidRows,
    asks: askRows,
    isEmpty: bidRows.length === 0 && askRows.length === 0,
    bestBid,
    bestAsk,
    spread,
  };
}
