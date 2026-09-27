'use client';

/**
 * One entry in the public "Recently Registered" list.
 *
 * The entry arrives with its reputation attached (the registry page reads
 * `get_active_profiles`, one call for the whole list rather than a reputation
 * read per row). The slash *history* — reasons and ledgers — is a separate
 * per-contract read, so it is fetched the first time the section is expanded
 * rather than for every row up front.
 */
import { useState } from 'react';
import { getSlashes, type RegistryProfile, type SlashRecord } from '@/lib/registry';
import { CATEGORY_LABELS } from '@/lib/registry';
import { formatStroops, truncateAddress } from '@/lib/formatters';
import { LifetimeSlashedBadge, StakeBadge, VerifiedBadge } from './RegistryBadges';

export interface RegistryEntryCardProps {
  profile: RegistryProfile;
  loadSlashes?: (contractId: string) => Promise<SlashRecord[]>;
}

const defaultLoadSlashes = (contractId: string) => getSlashes(contractId);

export default function RegistryEntryCard({ profile, loadSlashes = defaultLoadSlashes }: RegistryEntryCardProps) {
  const [open, setOpen] = useState(false);
  const [slashes, setSlashes] = useState<SlashRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { reputation } = profile;

  async function toggle() {
    const next = !open;
    setOpen(next);
    // Fetch once, on first expand: the section is the only place the history
    // is shown, so paying the read for a collapsed row would be waste.
    if (next && slashes === null) {
      setLoading(true);
      setError(null);
      try {
        setSlashes(await loadSlashes(profile.contractId));
      } catch {
        setSlashes([]);
        setError("Couldn't read the slash history.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="border border-[#e5e3ea] rounded-[10px] p-3.5 px-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-bold text-sm text-[#0e0e12]">{profile.name}</span>
        <span className="mono text-[11px] text-[#a6a3b0]">{truncateAddress(profile.contractId, 5)}</span>
      </div>
      <p className="text-xs text-[#6b6975] m-0">{profile.description}</p>
      {profile.categories && profile.categories.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-2 list-none p-0 m-0" aria-label="Categories">
          {profile.categories.map(category => (
            <li
              key={category}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#7c3aed]"
            >
              {CATEGORY_LABELS[category]}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {reputation.verified && <VerifiedBadge />}
        <StakeBadge stake={reputation.stake} />
        <LifetimeSlashedBadge slashedTotal={reputation.slashedTotal} />
      </div>

      <button
        onClick={toggle}
        aria-expanded={open}
        className="mt-2.5 text-[11px] font-bold text-[#8b5cf6] hover:underline underline-offset-2"
      >
        {open ? 'Hide slash history' : 'Slash history'}
      </button>

      {open && (
        <div className="mt-2 border-t border-[#f0eff3] pt-2.5">
          {loading ? (
            <p className="text-xs text-[#a6a3b0]">Loading slash history…</p>
          ) : error ? (
            <p role="alert" className="text-xs text-[#dc2626]">{error}</p>
          ) : slashes !== null && slashes.length === 0 ? (
            <p className="text-xs text-[#a6a3b0]">No slashes recorded.</p>
          ) : (
            slashes !== null && (
              <ul className="flex flex-col gap-1.5">
                {slashes.map((slash, i) => (
                  <li key={`${slash.slashedAt}-${i}`} className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-[#0e0e12] min-w-0">
                      <span className="mono">−{formatStroops(slash.amount)} XLM</span>
                      <span className="text-[#6b6975]"> · {slash.reason}</span>
                    </span>
                    <span className="mono text-[11px] text-[#a6a3b0] shrink-0">
                      ledger {slash.slashedAt.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}
    </div>
  );
}
