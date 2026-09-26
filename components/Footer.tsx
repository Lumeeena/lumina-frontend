"use client";

import { useState } from "react";

/**
 * The build's own version, inlined at build time from package.json (see
 * `next.config.ts`). The backend version is not shown: the API does not expose
 * one yet.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

export default function Footer() {
  const [copied, setCopied] = useState(false);
  const text = `Lumina frontend v${APP_VERSION}`;

  function copyVersion() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <footer className="border-t border-[#e5e3ea] px-6 py-4 flex items-center justify-center gap-3 text-[11px] text-[#a6a3b0]">
      <span className="mono" data-testid="app-version">{text}</span>
      <button
        type="button"
        onClick={copyVersion}
        aria-label="Copy version for bug reports"
        className="bg-[#f6f5f8] border border-[#e5e3ea] hover:border-[#c4b5fd] font-semibold text-[11px] px-2 py-[3px] rounded-[7px] text-[#0e0e12] transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </footer>
  );
}
