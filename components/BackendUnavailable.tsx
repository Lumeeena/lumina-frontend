"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BackendUnavailable({ onRetry }: { onRetry?: () => void }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    if (onRetry) onRetry();
    else router.refresh();
    window.setTimeout(() => setRetrying(false), 800);
  }

  return (
    <div role="alert" className="p-8 rounded-xl border border-[#fed7aa] bg-[#fffaf5] text-center">
      <p className="text-[#9a3412] font-semibold mb-2">Lumina data is temporarily unavailable</p>
      <p className="text-[#6b6975] text-sm max-w-lg mx-auto mb-4">
        We couldn’t reach the indexer. Check your connection or try again in a moment; your request has not been lost.
      </p>
      <button type="button" onClick={retry} disabled={retrying} className="bg-[#0e0e12] hover:bg-[#28262f] disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg">
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
