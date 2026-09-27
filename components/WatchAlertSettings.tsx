"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_OPERATION_FILTERS,
  OPERATION_TYPE_FILTERS,
  countActiveOperationFilters,
  type OperationFilters,
} from "@/lib/operationFilters";
import { setWatchFilters } from "@/lib/watches";

/** `SET_OPTIONS` and the rest read better in title case than as enum values. */
function labelFor(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export interface WatchAlertSettingsProps {
  address: string;
  filters: OperationFilters;
}

/**
 * Per-watch alert filter. Part of #9 / #83.
 *
 * All behaviour goes through props and `lib/watches.ts`, so this stays a
 * presentational component: the filter model, the matching and the persistence
 * are all testable in plain Node, and this file is only the controls.
 */
export default function WatchAlertSettings({ address, filters }: WatchAlertSettingsProps) {
  const [draft, setDraft] = useState<OperationFilters>(filters);

  // Adopt a new filter from storage when the watch list is rewritten elsewhere
  // (another tab, or the address's own page), without clobbering an in-progress
  // edit: the draft is only replaced when the stored value actually differs.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((current) => (sameFilters(current, filters) ? current : filters));
  }, [address, filters]);

  const commit = useCallback(
    (next: OperationFilters) => {
      setDraft(next);
      setWatchFilters(address, next);
    },
    [address],
  );

  const active = countActiveOperationFilters(draft);
  const atDefault = sameFilters(draft, DEFAULT_OPERATION_FILTERS);

  return (
    <fieldset
      data-testid="watch-alert-settings"
      data-address={address}
      className="grid gap-3 sm:grid-cols-3"
    >
      <legend className="sr-only">{`Alert filter for ${address}`}</legend>

      <div>
        <label
          htmlFor={`watch-type-${address}`}
          className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a6a3b0] mb-1"
        >
          Operation
        </label>
        <select
          id={`watch-type-${address}`}
          value={draft.operationType}
          onChange={(event) =>
            commit({
              ...draft,
              operationType: event.target
                .value as OperationFilters["operationType"],
            })
          }
          className="w-full rounded-lg border border-[#e5e3ea] bg-white px-2.5 py-2 text-[13px]"
        >
          {OPERATION_TYPE_FILTERS.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "Any operation" : labelFor(value)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`watch-amount-${address}`}
          className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a6a3b0] mb-1"
        >
          Minimum amount
        </label>
        <input
          id={`watch-amount-${address}`}
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          placeholder="Any"
          value={draft.minAmount ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
            const parsed = raw === "" ? NaN : Number(raw);
            commit({
              ...draft,
              // An unparseable or negative value clears the bound rather than
              // storing NaN, which would then match nothing and look like a
              // broken filter.
              minAmount:
                Number.isFinite(parsed) && parsed >= 0 ? parsed : null,
            });
          }}
          className="w-full rounded-lg border border-[#e5e3ea] bg-white px-2.5 py-2 text-[13px]"
        />
      </div>

      <div>
        <label
          htmlFor={`watch-asset-${address}`}
          className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a6a3b0] mb-1"
        >
          Asset
        </label>
        <input
          id={`watch-asset-${address}`}
          type="text"
          placeholder="Any"
          value={draft.asset}
          onChange={(event) => commit({ ...draft, asset: event.target.value })}
          className="w-full rounded-lg border border-[#e5e3ea] bg-white px-2.5 py-2 text-[13px] mono"
        />
      </div>

      <p className="sm:col-span-3 flex items-center gap-3 text-[12px] text-[#6b6975]">
        <span data-testid="watch-alert-active-count">
          {active === 0
            ? "No filter — every operation alerts."
            : `${active} ${active === 1 ? "filter" : "filters"} active.`}
        </span>
        {!atDefault && (
          <button
            type="button"
            onClick={() => commit({ ...DEFAULT_OPERATION_FILTERS })}
            className="font-semibold text-[#7c3aed] hover:text-[#6d28d9] hover:underline"
          >
            Reset to default
          </button>
        )}
      </p>
    </fieldset>
  );
}

function sameFilters(a: OperationFilters, b: OperationFilters): boolean {
  return (
    a.operationType === b.operationType &&
    a.minAmount === b.minAmount &&
    a.asset === b.asset
  );
}
