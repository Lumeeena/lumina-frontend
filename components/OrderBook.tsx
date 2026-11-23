import type { DepthRow, OrderBookView } from "@/lib/orderBook";

interface OrderBookProps {
  view: OrderBookView;
  /** Human label for the pair, e.g. "XLM / USDC". */
  pairLabel: string;
}

const th =
  "text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";
const thEnd = `${th} text-end`;
const cell = "px-3 py-1.5 mono text-xs tabular-nums text-[var(--color-text-secondary)]";
const cellEnd = `${cell} text-end`;

function DepthTable({
  caption,
  priceHeader,
  rows,
}: {
  caption: string;
  priceHeader: string;
  rows: DepthRow[];
}) {
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" className={th}>
            {priceHeader}
          </th>
          <th scope="col" className={thEnd}>
            Amount
          </th>
          <th scope="col" className={thEnd}>
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.price}
            className="border-b border-[var(--color-bg-overlay)] last:border-0"
          >
            <td className="relative px-3 py-1.5">
              {/* Decorative: the total column carries the same figure in text. */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 start-0 bg-[var(--color-accent-surface)]"
                style={{ width: `${row.depth}%` }}
              />
              <span className="relative mono text-xs tabular-nums text-[var(--color-text-primary)]">
                {row.price}
              </span>
            </td>
            <td className={cellEnd}>{row.amount}</td>
            <td className={cellEnd}>{row.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Bids and asks for one pair with cumulative depth. The numbers come from
 * `buildOrderBook`; this component only lays them out.
 */
export default function OrderBook({ view, pairLabel }: OrderBookProps) {
  if (view.isEmpty) {
    return (
      <div
        role="status"
        className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-8 text-center"
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          No open offers for {pairLabel} yet. The order book is empty, so there
          is no depth to show.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <dl className="flex flex-wrap gap-6 text-xs">
        <div>
          <dt className="text-[var(--color-text-muted)]">Best bid</dt>
          <dd className="mono tabular-nums text-[var(--color-text-primary)]">
            {view.bestBid ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-muted)]">Best ask</dt>
          <dd className="mono tabular-nums text-[var(--color-text-primary)]">
            {view.bestAsk ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-muted)]">Spread</dt>
          <dd className="mono tabular-nums text-[var(--color-text-primary)]">
            {view.spread ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section aria-labelledby="order-book-bids-heading">
          <h3
            id="order-book-bids-heading"
            className="font-semibold text-sm mb-2 text-[var(--color-text-primary)]"
          >
            Bids
          </h3>
          {view.bids.length > 0 ? (
            <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
              <DepthTable
                caption={`Bids for ${pairLabel}`}
                priceHeader="Bid price"
                rows={view.bids}
              />
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">No bids yet.</p>
          )}
        </section>

        <section aria-labelledby="order-book-asks-heading">
          <h3
            id="order-book-asks-heading"
            className="font-semibold text-sm mb-2 text-[var(--color-text-primary)]"
          >
            Asks
          </h3>
          {view.asks.length > 0 ? (
            <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
              <DepthTable
                caption={`Asks for ${pairLabel}`}
                priceHeader="Ask price"
                rows={view.asks}
              />
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">No asks yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
