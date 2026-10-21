"use client";

import { useState } from "react";
import type { SlashRecord } from "@/lib/registry";
import { formatStroops } from "@/lib/formatters";

export default function RegistrySlashHistory({
  contractId,
}: {
  contractId: string;
}) {
  const [open, setOpen] = useState(false);
  const [slashes, setSlashes] = useState<SlashRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    setOpen(!open);
    if (open || slashes !== null || loading) return;
    setLoading(true);
    setError(false);
    try {
      // Public rows do not ship the Soroban SDK until history is requested.
      const { getSlashes } = await import("@/lib/registry");
      setSlashes(await getSlashes(contractId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="mt-2.5 text-[11px] font-bold text-[var(--color-accent-text)] hover:underline underline-offset-2"
      >
        {open ? "Hide slash history" : "Slash history"}
      </button>
      {open && (
        <div className="mt-2 border-t border-[var(--color-border-default)] pt-2.5">
          {loading ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Loading slash history…
            </p>
          ) : error ? (
            <p role="alert" className="text-xs text-[var(--color-error-text)]">
              Couldn&apos;t read the slash history. Close and reopen to retry.
            </p>
          ) : slashes?.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              No slashes recorded.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {slashes?.map((slash, i) => (
                <li
                  key={`${slash.slashedAt}-${i}`}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="text-xs text-[var(--color-text-primary)] min-w-0">
                    <span className="mono">
                      −{formatStroops(slash.amount)} XLM
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {" "}
                      · {slash.reason}
                    </span>
                  </span>
                  <span className="mono text-[11px] text-[var(--color-text-muted)] shrink-0">
                    ledger {slash.slashedAt.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
