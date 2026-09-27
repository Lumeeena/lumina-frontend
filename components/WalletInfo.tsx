'use client';

/**
 * WalletInfo — shows the connected wallet's name, icon, and truncated address,
 * plus a disconnect button.
 *
 * Addresses #87 (disconnect control) and #88 (show which wallet is connected).
 */
import Image from 'next/image';
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
    <div className="flex items-center justify-between gap-2 bg-white border border-[#e5e3ea] rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Wallet icon — a data-URI from the kit's module */}
        {walletIcon ? (
          <img
            src={walletIcon}
            alt={walletName}
            width={18}
            height={18}
            className="rounded shrink-0"
          />
        ) : (
          /* Fallback monogram when the kit returns no icon */
          <span
            className="w-[18px] h-[18px] rounded bg-[#f5f3ff] text-[#7c3aed] text-[10px] font-bold flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {walletName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold text-[#6b6975] leading-none mb-0.5">
            {walletName}
          </span>
          <span className="block mono text-xs text-[#0e0e12] truncate" title={address}>
            {truncateAddress(address, 6)}
          </span>
        </div>
      </div>

      <button
        onClick={onDisconnect}
        disabled={disconnecting}
        title="Disconnect wallet"
        aria-label="Disconnect wallet"
        className="text-[11px] font-semibold text-[#dc2626] hover:text-[#b91c1c] disabled:opacity-50 shrink-0 transition-colors"
      >
        {disconnecting ? 'Disconnecting…' : 'Disconnect'}
      </button>
    </div>
  );
}
