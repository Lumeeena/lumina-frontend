/**
 * Reputation badges for registry entries: verified status, staked amount and
 * lifetime slashed total.
 *
 * Shared between the public registry list and the owner dashboard so the same
 * signal reads the same way everywhere it appears.
 *
 * The badges state facts, not verdicts: a slash is governance-recorded
 * history, shown with its amount rather than any judgement of what it means.
 * Verified is an icon *and* text, never colour alone, so it survives
 * greyscale and colour-blind reading.
 */
import { BadgeCheck, Coins, History } from 'lucide-react';
import { formatStroops } from '@/lib/formatters';

function Badge({ icon, label, title }: { icon: React.ReactNode; label: string; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f6f5f8] text-[#6b6975]"
    >
      {icon}
      {label}
    </span>
  );
}

/** Governance-attested status. Icon + text, distinct without colour alone. */
export function VerifiedBadge() {
  return (
    <Badge
      // `role="img"` is explicit because an `<svg>` with a label but no role is
      // not reliably announced, and this icon is the part that disappears in
      // greyscale — it needs to carry the same words for anyone who cannot see
      // it.
      icon={
        <BadgeCheck
          className="w-3 h-3 text-[#7c3aed]"
          role="img"
          aria-label="Attested by registry governance"
        />
      }
      label="Verified"
      title="Attested by registry governance"
    />
  );
}

/** Current stake, when the registration has posted collateral. */
export function StakeBadge({ stake }: { stake: bigint }) {
  // BigInt literals need an ES2020 target; this project builds for ES2017.
  if (stake <= BigInt(0)) return null;
  return (
    <Badge
      icon={<Coins className="w-3 h-3" aria-hidden="true" />}
      label={`Staked ${formatStroops(stake)} XLM`}
      title="Current stake posted against this registration"
    />
  );
}

/** Lifetime total slashed, when any slash has landed. */
export function LifetimeSlashedBadge({ slashedTotal }: { slashedTotal: bigint }) {
  if (slashedTotal <= BigInt(0)) return null;
  return (
    <Badge
      icon={<History className="w-3 h-3" aria-hidden="true" />}
      label={`Slashed ${formatStroops(slashedTotal)} XLM`}
      title="Lifetime total slashed by registry governance"
    />
  );
}
