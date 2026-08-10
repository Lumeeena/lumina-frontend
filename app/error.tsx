'use client';

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <p className="text-[#dc2626] font-semibold mb-2">Something went wrong</p>
      <p className="text-[#6b6975] text-sm mb-6">
        We couldn&apos;t load this page. This is usually a temporary issue reaching the Stellar network.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg text-sm font-semibold transition-colors"
      >
        Try again
      </button>
      {error.digest && (
        <p className="text-xs text-[#c3c1cb] mt-6 mono">Error digest: {error.digest}</p>
      )}
    </div>
  );
}
