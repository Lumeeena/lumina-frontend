"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_WATCHES,
  addWatch,
  exportWatches,
  importWatches,
  loadWatches,
  removeWatch,
  subscribeToWatches,
  watchListIsFull,
  type WatchEntry,
} from "@/lib/watches";
import { validateStellarAddress } from "@/lib/stellarAddress";
import { truncateAddress } from "@/lib/formatters";
import { withNetwork } from "@/lib/network";
import { useNetwork } from "@/lib/useNetwork";
import {
  countActiveOperationFilters,
  operationFiltersToQueryString,
} from "@/lib/operationFilters";
import WatchAlertSettings from "./WatchAlertSettings";
import { getLocale, t } from "@/lib/i18n";

/**
 * The watch list, with per-watch alert settings. Part of #9 / #80, #83, #84.
 */
export default function WatchedAddressList() {
  const { network } = useNetwork();
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  // Import state
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => {
      setEntries(loadWatches());
      setFull(watchListIsFull());
    };
    // Hydrate browser-only storage after SSR; this intentionally needs one update.
    sync();
    return subscribeToWatches(sync);
  }, []);

  const handleAdd = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const address = draft.trim().toUpperCase();
      const validation = validateStellarAddress(address);
      if (!validation.valid) {
        setError(
          validation.reason === "empty"
            ? t("watchList.errorEmpty")
            : t("watchList.errorInvalid", { hint: validation.hint }),
        );
        return;
      }
      if (entries.some((entry) => entry.address === address)) {
        setError(t("watchList.errorDuplicate"));
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

  const handleExport = useCallback(() => {
    const dataStr = exportWatches();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lumina-watches.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPendingFileContent(content);
      };
      reader.readAsText(file);
      // Reset file input value so re-selecting the same file triggers onChange again
      event.target.value = "";
    },
    [],
  );

  const confirmImport = useCallback(() => {
    if (!pendingFileContent) return;
    const res = importWatches(pendingFileContent, importMode);
    if (!res.success) {
      setError(
        t("watchList.importFailed", {
          error: res.error || t("watchList.importFailedFallback"),
        }),
      );
    } else {
      setError(null);
    }
    setPendingFileContent(null);
  }, [pendingFileContent, importMode]);

  return (
    <section aria-labelledby="watch-list-heading" className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <h2
          id="watch-list-heading"
          className="font-extrabold text-base text-[var(--color-text-primary)]"
        >
          {t("watchList.heading")}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0}
            className="rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-50 text-[12px] font-semibold text-[var(--color-text-primary)] px-3 py-1.5 transition-colors"
          >
            {t("watchList.exportList")}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)] text-[12px] font-semibold text-[var(--color-text-primary)] px-3 py-1.5 transition-colors"
          >
            {t("watchList.importList")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
            aria-label={t("watchList.importFileLabel")}
          />
        </div>
      </div>

      {pendingFileContent !== null && (
        <div className="mb-4 p-4 rounded-xl border border-[var(--color-accent-fill)]/30 bg-[var(--color-bg-subtle)]">
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-2">
            {t("watchList.importTitle")}
          </h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-3">
            {t("watchList.importPrompt")}
          </p>
          <div className="flex items-center gap-4 mb-4 text-[13px]">
            <label className="flex items-center gap-1.5 font-medium cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === "merge"}
                onChange={() => setImportMode("merge")}
              />
              {t("watchList.mergeOption")}
            </label>
            <label className="flex items-center gap-1.5 font-medium cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === "replace"}
                onChange={() => setImportMode("replace")}
              />
              {t("watchList.replaceOption")}
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmImport}
              className="rounded-lg bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white font-bold text-[12px] px-3 py-1.5 transition-colors"
            >
              {t("watchList.confirmImport")}
            </button>
            <button
              type="button"
              onClick={() => setPendingFileContent(null)}
              className="rounded-lg border border-[var(--color-border-default)] text-[12px] font-semibold px-3 py-1.5 transition-colors"
            >
              {t("watchList.cancel")}
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap gap-2 items-start mb-4"
      >
        <div className="flex-1 min-w-[16rem]">
          <label htmlFor="watch-address" className="sr-only">
            {t("watchList.addressLabel")}
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
          {t("watchList.addWatch")}
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
        <p
          className="mb-4 text-[13px] text-[var(--color-text-secondary)]"
          data-testid="watch-list-full"
        >
          {t("watchList.listFull", {
            count: new Intl.NumberFormat(getLocale()).format(MAX_WATCHES),
          })}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border-default)] p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
          {t("watchList.emptyState")}
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
                  href={withNetwork(`/accounts/${entry.address}`, network)}
                  className="mono text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline"
                >
                  {truncateAddress(entry.address, 6)}
                </Link>
                <a
                  href={filterHref(entry, network)}
                  className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
                >
                  {t("watchList.filtersCount", {
                    count: countActiveOperationFilters(entry.filters),
                  })}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(entry.address)}
                  aria-label={t("watchList.unwatch", {
                    address: entry.address,
                  })}
                  className="ms-auto text-[12px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-error-text)] hover:underline"
                >
                  {t("watchList.remove")}
                </button>
              </div>
              <WatchAlertSettings
                address={entry.address}
                filters={entry.filters}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The account page with this watch's filter pre-selected, as a shareable link. */
function filterHref(
  entry: WatchEntry,
  network: ReturnType<typeof useNetwork>["network"],
): string {
  const baseHref = `/accounts/${entry.address}`;
  const withNetworkHref = withNetwork(baseHref, network);
  const query = operationFiltersToQueryString(entry.filters);
  if (!query) return withNetworkHref;
  const queryIdx = withNetworkHref.indexOf("?");
  if (queryIdx === -1) {
    return `${withNetworkHref}${withNetworkHref.includes("?") ? "&" : "?"}${query}`;
  }
  return `${withNetworkHref.slice(0, queryIdx)}?${query}&${withNetworkHref.slice(queryIdx + 1)}`;
}
