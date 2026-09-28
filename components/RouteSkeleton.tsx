/**
 * The shape a route shows while it waits for its data.
 *
 * Next streams `loading.tsx` the moment a navigation starts and swaps in the
 * real page when the fetch resolves, so this is what a slow indexer actually
 * looks like to someone waiting. It mirrors the layout of the page it stands in
 * for — the same blocks in the same places — because a skeleton that reshuffles
 * on arrival is worse than a spinner.
 *
 * The blocks are `aria-hidden` and the label is announced instead: a screen
 * reader should be told the page is loading, not read a list of empty
 * rectangles.
 */
const BAR = "bg-[var(--color-bg-overlay)] rounded animate-pulse";

export default function RouteSkeleton({
  label,
  cards = 0,
  rows = 3,
  filters = 0,
}: {
  /** What is loading, announced once, e.g. "Loading stats". */
  label: string;
  /** A row of stat cards, for pages that lead with figures. */
  cards?: number;
  /** Table rows or repeated data regions below the heading. */
  rows?: number;
  /** Filter controls before the main data region. */
  filters?: number;
}) {
  return (
    <div role="status" aria-label={label} className="px-4 sm:px-7 py-12">
      <span className="sr-only">{label}</span>

      <div className="max-w-[1160px] mx-auto mb-8" aria-hidden="true">
        <div className={`h-9 w-64 mb-3 ${BAR}`} />
        <div className={`h-5 w-[min(34rem,100%)] ${BAR}`} />
      </div>

      {cards > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1160px] mx-auto mb-9" aria-hidden="true">
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="border border-[var(--color-border-default)] rounded-xl p-5 flex flex-col gap-2.5">
              <div className={`h-2.5 w-20 ${BAR}`} />
              <div className={`h-6 w-28 ${BAR}`} />
              <div className={`h-2.5 w-16 ${BAR}`} />
            </div>
          ))}
        </div>
      )}

      {filters > 0 && (
        <div className="max-w-[1160px] mx-auto flex gap-3 mb-7" aria-hidden="true">
          {Array.from({ length: filters }, (_, i) => (
            <div key={i} className={`h-[46px] flex-1 ${BAR}`} />
          ))}
        </div>
      )}

      <div className="max-w-[1160px] mx-auto rounded-xl border border-[var(--color-border-default)] overflow-hidden" aria-hidden="true">
        <div className="h-10 border-b border-[var(--color-border-default)] bg-[var(--color-bg-raised)]" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-[45px] px-4 border-b border-[var(--color-border-default)] last:border-0 flex items-center gap-4">
            <div className={`h-3 w-1/4 ${BAR}`} />
            <div className={`h-3 w-1/3 ${BAR}`} />
            <div className={`h-3 w-1/5 ${BAR}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
