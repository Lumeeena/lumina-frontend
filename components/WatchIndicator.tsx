'use client';

/**
 * WatchIndicator — a small bookmark icon shown next to any Stellar address.
 *
 * Clicking it toggles the address in/out of the localStorage watch list.
 * Appears wherever an address is shown in the UI so watched addresses are
 * immediately recognisable (#85).
 */
import { useEffect, useState } from 'react';
import { isWatched, toggleWatch } from '@/lib/watches';

export default function WatchIndicator({ address }: { address: string }) {
  // Start as false to match the server render (no localStorage there), then
  // sync to actual state after hydration.
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setWatched(isWatched(address));
  }, [address]);

  function handleToggle(e: React.MouseEvent) {
    // Stop clicks from bubbling up to any parent link (e.g. account page link).
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWatch(address);
    setWatched(next);
  }

  return (
    <button
      onClick={handleToggle}
      title={watched ? 'Remove from watch list' : 'Add to watch list'}
      aria-label={watched ? `Unwatch ${address}` : `Watch ${address}`}
      aria-pressed={watched}
      className={`inline-flex items-center justify-center rounded transition-colors shrink-0
        ${watched
          ? 'text-[#7c3aed] hover:text-[#6d28d9]'
          : 'text-[#c3c1cb] hover:text-[#7c3aed]'
        }`}
    >
      {/* Bookmark icon — filled when watched, outline when not */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
        fill={watched ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={watched ? '0' : '1.5'}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v12l-5-3-5 3V2.5Z"
        />
      </svg>
    </button>
  );
}
