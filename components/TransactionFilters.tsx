"use client";

import { useState } from "react";
import {
  EMPTY_FILTERS,
  countActiveFilters,
  type TransactionFilters as Filters,
} from "@/lib/transactionFilters";
import type { FilterPreset } from "@/lib/filterPresets";

const field =
  "min-h-[38px] px-3 py-2 text-[13px] bg-white border border-[#e5e3ea] rounded-[9px] focus:outline-none focus:border-[#c4b5fd]";
const label = "block text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] mb-1.5";

export interface TransactionFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  presets: FilterPreset[];
  onSavePreset: (name: string) => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (name: string) => void;
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
      <div className="inline-flex border border-[#e5e3ea] rounded-[9px] overflow-hidden mb-4">
        {(["all", "successful", "failed"] as const).map(status => (
          <button
            key={status}
            type="button"
            onClick={() => set("status", status)}
            aria-pressed={filters.status === status}
            className={`border-none px-[18px] py-[9px] text-sm font-semibold capitalize transition-colors ${
              filters.status === status ? "bg-[#8b5cf6] text-white" : "bg-white text-[#6b6975] hover:bg-[#fafafa]"
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
          <input
            id="filter-source"
            type="text"
            placeholder="G..."
            className={`${field} w-full mono`}
            value={filters.source}
            onChange={e => set("source", e.target.value)}
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
          className="bg-[#f6f5f8] border border-[#e5e3ea] enabled:hover:border-[#c4b5fd] disabled:opacity-50 font-semibold text-[13px] px-4 py-2 rounded-[9px] transition-colors"
        >
          Save preset
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-[13px] font-semibold text-[#7c3aed] hover:text-[#6d28d9] px-2 py-2"
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
              className="inline-flex items-center gap-1 text-[12px] font-semibold rounded-full bg-[#f3effe] text-[#6d28d9] pl-3 pr-1.5 py-1"
            >
              <button type="button" onClick={() => onApplyPreset(preset)} className="hover:underline">
                {preset.name}
              </button>
              <button
                type="button"
                aria-label={`Delete preset ${preset.name}`}
                onClick={() => onDeletePreset(preset.name)}
                className="text-[#a78bfa] hover:text-[#6d28d9] px-1 leading-none"
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
