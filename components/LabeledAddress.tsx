"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLabel } from "@/lib/addressLabels";
import { formatAddress } from "@/lib/formatters";

interface Props {
  address: string;
  copyable?: boolean;
}

export default function LabeledAddress({ address, copyable = false }: Props) {
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [showAddress, setShowAddress] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l = getLabel(address);
    setLabel(l);
  }, [address]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Copy failed.
    }
  }, [address]);

  const displayText = label || formatAddress(address);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowAddress(!showAddress)}
        onMouseEnter={() => setShowAddress(true)}
        onMouseLeave={() => setShowAddress(false)}
        className="font-mono text-sm text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] transition-colors cursor-help"
        title={label ? address : undefined}
      >
        {displayText}
      </button>

      {showAddress && label && (
        <div
          ref={tooltipRef}
          className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md text-xs font-mono text-[var(--color-text-primary)] whitespace-nowrap shadow-md z-10"
        >
          {formatAddress(address)}
          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              className="ml-2 text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)]"
              title="Copy address"
            >
              Copy
            </button>
          )}
        </div>
      )}
    </div>
  );
}
