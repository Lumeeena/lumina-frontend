"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  classifySearch,
  searchHref,
  SEARCH_KIND_LABEL,
} from "@/lib/searchQuery";

/**
 * The one search box for everything on the network.
 *
 * The user types whatever they have — an address, a transaction hash, a
 * contract id, a memo — and the box works out what it was given and routes to
 * the right page. The classification is shown live as a hint while typing, so
 * the routing is legible rather than magical: the user can see that a `G…`
 * string is being read as an account before they submit it.
 *
 * `data-shortcut-search` is what the `/` keyboard shortcut focuses (see
 * `lib/shortcuts.ts`); without it the shortcut has nothing to land on.
 */
export default function SearchBar({
  placeholder = "Search an account, transaction, contract or memo…",
  buttonLabel = "Search",
}: {
  placeholder?: string;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const classified = classifySearch(value);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = classifySearch(value);
    if (!result) return;
    router.push(searchHref(result));
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2.5">
      <div className="relative flex-1">
        <input
          data-shortcut-search
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className={`w-full min-h-[46px] px-3.5 py-2.5 text-[13px] mono bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-[9px] outline-none focus:border-[var(--color-border-strong)] ${
            classified ? "pr-[104px]" : ""
          }`}
        />
        {classified && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[var(--color-accent-text)] bg-[var(--color-accent-surface)] rounded-md px-2 py-[3px]"
          >
            {SEARCH_KIND_LABEL[classified.kind]}
          </span>
        )}
      </div>
      <button
        type="submit"
        className="bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white font-bold text-sm px-6 rounded-[9px] transition-colors"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
