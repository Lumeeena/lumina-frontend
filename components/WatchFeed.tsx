"use client";

import Link from "next/link";
import { useWatchedActivity, type WatchActivity } from "@/lib/useWatchedActivity";
import { matchesOperationFilters } from "@/lib/operationFilters";
import { truncateAddress } from "@/lib/formatters";
import ConnectionIndicator from "./ConnectionIndicator";
import TimeAgo from "./TimeAgo";

/**
 * The combined feed for every watched address. Part of #9 / #80.
 *
 * One socket, one list, one stream — see `lib/useWatchedActivity.ts` for why
 * this is not one `AccountActivityFeed` per address.
 *
 * Shows every operation, and marks the ones that would have raised an alert.
 * Hiding the rest would make the feed lie about what the address did; the alert
 * is a policy decision, not a fact about the account.
 */
export default function WatchFeed() {
  const { activity, entries, state, failureReason, retry, watching, alertCount } =
    useWatchedActivity();

  // A map rather than a lookup per row, so rendering N rows is O(N) over a
  // fixed size instead of rescanning the watch list for every row.
  const filtersByAddress = new Map(entries.map((entry) => [entry.address, entry.filters]));

  return (
    <section aria-labelledby="watch-feed-heading" className="mb-10">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2
          id="watch-feed-heading"
          className="font-extrabold text-base text-[#0e0e12]"
        >
          Live activity
        </h2>
        <ConnectionIndicator
          state={state}
          failureReason={failureReason}
          onRetry={retry}
        />
      </div>

      {watching === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p className="text-[13px] text-[#6b6975] mb-3" data-testid="watch-summary">
            {`${watching} watched ${watching === 1 ? "address" : "addresses"}`}
            {alertCount > 0
              ? ` · ${alertCount} matching ${alertCount === 1 ? "alert" : "alerts"} this session`
              : ""}
          </p>
          <div
            className="rounded-xl border border-[#e5e3ea] overflow-hidden"
            data-testid="watch-feed"
          >
            {activity.length === 0 ? (
              <p className="p-6 text-center text-[#a6a3b0] text-sm">
                Waiting for activity on your watched addresses&hellip;
              </p>
            ) : (
              activity.map((item) => {
                const filters = filtersByAddress.get(item.address);
                return (
                  <WatchActivityRow
                    key={item.id}
                    item={item}
                    alerts={filters ? matchesOperationFilters(item.operation, filters) : false}
                  />
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[#e5e3ea] p-8 text-center">
      <p className="text-sm font-semibold text-[#0e0e12]">
        You are not watching any addresses yet
      </p>
      <p className="mt-1 text-[13px] text-[#6b6975]">
        Use the bookmark next to any address to follow its activity here, and get
        an alert when something happens on it.
      </p>
    </div>
  );
}

function WatchActivityRow({
  item,
  alerts,
}: {
  item: WatchActivity;
  alerts: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f0eff3] last:border-0">
      <span className="text-[11px] font-semibold rounded-full bg-[#f3effe] text-[#6d28d9] px-2.5 py-0.5 shrink-0">
        {item.operation.type}
      </span>
      <Link
        href={`/accounts/${item.address}`}
        className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
      >
        {truncateAddress(item.address, 5)}
      </Link>
      {item.operation.amount && (
        <span className="mono text-xs text-[#0e0e12]">
          {item.operation.amount} {item.operation.asset ?? "XLM"}
        </span>
      )}
      {alerts && (
        <span
          className="text-[10px] font-bold uppercase tracking-wide text-[#16a34a]"
          data-testid="watch-feed-alert"
        >
          alert
        </span>
      )}
      <span className="ml-auto text-[11px] text-[#c3c1cb] shrink-0">
        <TimeAgo isoString={item.operation.createdAt} />
      </span>
    </div>
  );
}
