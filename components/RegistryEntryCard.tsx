
/**
 * One entry in the public "Recently Registered" list.
 *
 * The entry arrives with its reputation attached (the registry page reads
 * `get_active_profiles`, one call for the whole list rather than a reputation
 * read per row). The slash *history* — reasons and ledgers — is a separate
 * per-contract read, so it is fetched the first time the section is expanded
 * rather than for every row up front.
 */
import type { RegistryProfile } from '@/lib/registry';
import RegistrySlashHistory from './RegistrySlashHistory';
import { CATEGORY_LABELS } from '@/lib/registry';
import { LifetimeSlashedBadge, StakeBadge, VerifiedBadge } from './RegistryBadges';
import ContractLink from './ContractLink';

export interface RegistryEntryCardProps {
  profile: RegistryProfile;
}

export default function RegistryEntryCard({ profile }: RegistryEntryCardProps) {
  const { reputation } = profile;

  return (
    <div className="border border-[var(--color-border-default)] rounded-[10px] p-3.5 px-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-bold text-sm text-[var(--color-text-primary)]">{profile.name}</span>
        <ContractLink contractId={profile.contractId} truncate={5} className="text-[11px]" />
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] m-0">{profile.description}</p>
      {profile.categories && profile.categories.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-2 list-none p-0 m-0" aria-label="Categories">
          {profile.categories.map(category => (
            <li
              key={category}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]"
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

      <RegistrySlashHistory contractId={profile.contractId} />
    </div>
  );
}
