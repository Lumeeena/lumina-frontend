"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_FILTERS,
  countActiveFilters,
  type TransactionFilters as Filters,
} from "@/lib/transactionFilters";
import type { FilterPreset } from "@/lib/filterPresets";

const field =
  "min-h-[38px] px-3 py-2 text-[13px] bg-white border border-[var(--color-border-default)] rounded-[9px] focus:outline-none focus:border-[var(--color-border-strong)]";
const label = "block text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-1.5";

export interface TransactionFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  presets: FilterPreset[];
  onSavePreset: (name: string) => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (name: string) => void;
}

function SourceAccountInput({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (value: string) => void;
  className: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => onCommit(draft), 300);
    return () => window.clearTimeout(timer);
  }, [draft, onCommit, value]);

  return (
    <input
      id="filter-source"
      type="text"
      placeholder="G..."
      className={className}
      value={draft}
      onChange={event => setDraft(event.target.value)}
    />
  );
}

export default function TransactionFilters({
  filters,
  onChange,
  presets,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
}: TransactionFiltersProps) {
  const [presetName, setPresetName] = useState("");
  const activeCount = countActiveFilters(filters);
  const commitSource = useCallback(
    (source: string) => onChange({ ...filters, source }),
    [filters, onChange],
  );

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function saveCurrent() {
    const name = presetName.trim();
    if (!name) return;
    onSavePreset(name);
    setPresetName("");
  }

  return (
    <div className="mb-6" data-testid="transaction-filters">
      <div className="inline-flex border border-[var(--color-border-default)] rounded-[9px] overflow-hidden mb-4">
        {(["all", "successful", "failed"] as const).map(status => (
          <button
            key={status}
            type="button"
            onClick={() => set("status", status)}
            aria-pressed={filters.status === status}
            className={`border-none px-[18px] py-[9px] text-sm font-semibold capitalize transition-colors ${
              filters.status === status ? "bg-[var(--color-accent-9)] text-white" : "bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div>
          <label className={label} htmlFor="filter-from">From</label>
          <input
            id="filter-from"
            type="date"
            className={`${field} w-full`}
            value={filters.fromDate ?? ""}
            onChange={e => set("fromDate", e.target.value || null)}
          />
        </div>
        <div>
          <label className={label} htmlFor="filter-to">To</label>
          <input
            id="filter-to"
            type="date"
            className={`${field} w-full`}
            value={filters.toDate ?? ""}
            onChange={e => set("toDate", e.target.value || null)}
          />
        </div>
        <div>
          <label className={label} htmlFor="filter-source">Source account</label>
          <SourceAccountInput
            key={filters.source}
            value={filters.source}
            onCommit={commitSource}
            className={`${field} w-full mono`}
          />
        </div>
        <div>
          <label className={label} htmlFor="filter-min-ops">Min operations</label>
          <input
            id="filter-min-ops"
            type="number"
            min={0}
            className={`${field} w-full`}
            value={filters.minOperations ?? ""}
            onChange={e => set("minOperations", e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
        <div>
          <label className={label} htmlFor="filter-max-fee">Max fee (XLM)</label>
          <input
            id="filter-max-fee"
            type="number"
            min={0}
            step="0.0000001"
            className={`${field} w-full`}
            value={filters.maxFeeXlm ?? ""}
            onChange={e => set("maxFeeXlm", e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Name this filter"
          aria-label="Preset name"
          className={`${field} w-[190px]`}
          value={presetName}
          onChange={e => setPresetName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") saveCurrent();
          }}
        />
        <button
          type="button"
          onClick={saveCurrent}
          disabled={!presetName.trim()}
          className="bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] enabled:hover:border-[var(--color-border-strong)] disabled:opacity-50 font-semibold text-[13px] px-4 py-2 rounded-[9px] transition-colors"
        >
          Save preset
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-[13px] font-semibold text-[var(--color-accent-10)] hover:text-[var(--color-accent-11)] px-2 py-2"
          >
            Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {presets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-3">
          {presets.map(preset => (
            <span
              key={preset.name}
              className="inline-flex items-center gap-1 text-[12px] font-semibold rounded-full bg-[var(--color-accent-3)] text-[var(--color-accent-11)] pl-3 pr-1.5 py-1"
            >
              <button type="button" onClick={() => onApplyPreset(preset)} className="hover:underline">
                {preset.name}
              </button>
              <button
                type="button"
                aria-label={`Delete preset ${preset.name}`}
                onClick={() => onDeletePreset(preset.name)}
                className="text-[var(--color-border-strong)] hover:text-[var(--color-accent-11)] px-1 leading-none"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
