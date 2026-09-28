'use client';

/**
 * WalletInfo — shows the connected wallet's name, icon, and truncated address,
 * plus a disconnect button.
 */
import { truncateAddress } from '@/lib/formatters';

export interface WalletInfoProps {
  address: string;
  walletName: string;
  walletIcon: string;
  onDisconnect: () => void;
  disconnecting?: boolean;
}

export default function WalletInfo({
  address,
  walletName,
  walletIcon,
  onDisconnect,
  disconnecting = false,
}: WalletInfoProps) {
  return (
    <div className="flex items-center justify-between gap-2 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {walletIcon ? (
          <img
            src={walletIcon}
            alt={walletName}
            width={18}
            height={18}
            className="rounded shrink-0"
          />
        ) : (
          <span
            className="w-[18px] h-[18px] rounded bg-[var(--color-accent-surface)] text-[var(--color-accent-text)] text-[10px] font-bold flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {walletName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold text-[var(--color-text-secondary)] leading-none mb-0.5">
            {walletName}
          </span>
          <span
            className="block mono text-xs text-[var(--color-text-primary)] truncate"
            title={address}
          >
            {truncateAddress(address, 6)}
          </span>
        </div>
      </div>

      <button
        onClick={onDisconnect}
        disabled={disconnecting}
        title="Disconnect wallet"
        aria-label="Disconnect wallet"
        className="text-[11px] font-semibold text-[var(--color-error-text)] hover:text-[var(--color-error-dark)] disabled:opacity-50 shrink-0 transition-colors"
      >
        {disconnecting ? 'Disconnecting…' : 'Disconnect'}
      </button>
    </div>
  );
}
