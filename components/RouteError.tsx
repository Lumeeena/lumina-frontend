'use client';

import { useEffect } from "react";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  route: string;
}

export default function RouteError({ error, reset, route }: RouteErrorProps) {
  useEffect(() => {
    console.error(`[${route}]`, error);
  }, [error, route]);

  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <p className="text-[#dc2626] font-semibold mb-2">Failed to load {route}</p>
      <p className="text-[#6b6975] text-sm mb-6">
        This is usually a temporary issue reaching the Stellar network. The rest of the app is still available.
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
