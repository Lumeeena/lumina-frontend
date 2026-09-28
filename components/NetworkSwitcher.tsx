"use client";

import { DEFAULT_NETWORK, NETWORKS, parseNetwork } from "@/lib/network";
import { useNetwork } from "@/lib/useNetwork";

/**
 * Which network the page in front of you is about.
 *
 * A plain `<select>`, not a popover or a segmented control: it is keyboard-
 * and screen-reader-native, and it holds no state of its own — the selection
 * *is* the URL (see `lib/useNetwork.ts`), so the control cannot disagree with
 * the address bar about what is selected.
 *
 * Off the default network the control is deliberately coloured. A mainnet page
 * and a testnet page look identical otherwise, and "which chain is this hash
 * from" is not a question a reader should have to answer by inspecting the URL
 * they were sent.
 */
export default function NetworkSwitcher() {
  const { network, setNetwork } = useNetwork();
  const offDefault = network !== DEFAULT_NETWORK;

  return (
    <span className="flex items-center gap-1.5 shrink-0">
      {/* Decorative: the select's own label says which network it is. */}
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full transition-colors ${
          offDefault ? "bg-[var(--color-warning-text)]" : "bg-[var(--color-accent-fill)]"
        }`}
      />
      <select
        aria-label="Stellar network"
        value={network}
        onChange={(event) => {
          // The options come from `NETWORKS`, so a value that names no network
          // is not something a user can produce by choosing; ignoring it leaves
          // the control showing the network the URL already selects.
          const next = parseNetwork(event.target.value);
          if (next && next !== network) setNetwork(next);
        }}
        className={`text-[12.5px] font-semibold rounded-lg border px-1.5 py-1.5 cursor-pointer outline-none focus:border-[var(--color-border-strong)] ${
          offDefault
            ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
            : "border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
        }`}
      >
        {NETWORKS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}
