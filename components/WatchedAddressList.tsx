"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MAX_WATCHES,
  addWatch,
  loadWatches,
  removeWatch,
  subscribeToWatches,
  watchListIsFull,
  type WatchEntry,
} from "@/lib/watches";
import { validateStellarAddress } from "@/lib/stellarAddress";
import { truncateAddress } from "@/lib/formatters";
import {
  countActiveOperationFilters,
  operationFiltersToQueryString,
} from "@/lib/operationFilters";
import WatchAlertSettings from "./WatchAlertSettings";

/**
 * The watch list, with per-watch alert settings. Part of #9 / #80 and / #83.
 *
 * The list is the only place a watch can be added by typing an address, so
 * someone who found an address on another site does not have to navigate to its
 * Lumina page to follow it.
 */
export default function WatchedAddressList() {
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const sync = () => {
      setEntries(loadWatches());
      setFull(watchListIsFull());
    };
    // Hydrate browser-only storage after SSR; this intentionally needs one update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    sync();
    return subscribeToWatches(sync);
  }, []);

  const handleAdd = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const address = draft.trim().toUpperCase();
      // The shared validator returns a hint about what is actually wrong, which
      // beats "invalid address" — most attempts are a lowercase paste or a
      // contract id, and the hint says so.
      const validation = validateStellarAddress(address);
      if (!validation.valid) {
        setError(
          validation.reason === "empty"
            ? "Enter an address to watch."
            : `That is not a Stellar account ID: ${validation.hint}.`,
        );
        return;
      }
      if (entries.some((entry) => entry.address === address)) {
        setError("That address is already on your watch list.");
        return;
      }
      addWatch(address);
      setDraft("");
      setError(null);
    },
    [draft, entries],
  );

  const handleRemove = useCallback((address: string) => {
    removeWatch(address);
  }, []);

  return (
    <section aria-labelledby="watch-list-heading" className="mb-10">
      <h2
        id="watch-list-heading"
        className="font-extrabold text-base text-[var(--color-text-primary)] mb-3"
      >
        Watched addresses
      </h2>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-start mb-4">
        <div className="flex-1 min-w-[16rem]">
          <label htmlFor="watch-address" className="sr-only">
            Stellar address to watch
          </label>
          <input
            id="watch-address"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            placeholder="G…"
            aria-invalid={error !== null}
            aria-describedby={error ? "watch-address-error" : undefined}
            className="w-full rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-[13px] mono"
          />
        </div>
        <button
          type="submit"
          disabled={full}
          className="rounded-lg bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] disabled:opacity-50 disabled:hover:bg-[var(--color-accent-fill)] text-white font-bold text-[13px] px-4 py-2 transition-colors"
        >
          Add watch
        </button>
      </form>

      {error && (
        <p
          id="watch-address-error"
          role="alert"
          data-testid="watch-add-error"
          className="mb-4 text-[13px] text-[var(--color-error-text)]"
        >
          {error}
        </p>
      )}

      {full && (
        <p className="mb-4 text-[13px] text-[var(--color-text-secondary)]" data-testid="watch-list-full">
          {`The list is capped at ${MAX_WATCHES} addresses. Remove one to add another.`}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border-default)] p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
          Nothing watched yet. Add an address above, or use the bookmark icon next
          to any account on the site.
        </p>
      ) : (
        <ul className="space-y-4" data-testid="watch-list">
          {entries.map((entry) => (
            <li
              key={entry.address}
              className="rounded-xl border border-[var(--color-border-default)] p-4"
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Link
                  href={`/accounts/${entry.address}`}
                  className="mono text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline"
                >
                  {truncateAddress(entry.address, 6)}
                </Link>
                <a
                  href={filterHref(entry)}
                  className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
                >
                  {`${countActiveOperationFilters(entry.filters)} ${
                    countActiveOperationFilters(entry.filters) === 1
                      ? "filter"
                      : "filters"
                  }`}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(entry.address)}
                  aria-label={`Unwatch ${entry.address}`}
                  className="ml-auto text-[12px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-error-text)] hover:underline"
                >
                  Remove
                </button>
              </div>
              <WatchAlertSettings address={entry.address} filters={entry.filters} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The account page with this watch's filter pre-selected, as a shareable link. */
function filterHref(entry: WatchEntry): string {
  const query = operationFiltersToQueryString(entry.filters);
  return query ? `/accounts/${entry.address}?${query}` : `/accounts/${entry.address}`;
}
