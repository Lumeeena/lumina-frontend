'use client';

import { useState } from "react";
export default function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={copyAddress} className="bg-[#f6f5f8] border border-[#e5e3ea] hover:border-[#c4b5fd] font-semibold text-[11px] px-2.5 py-[5px] rounded-[7px] shrink-0 transition-colors">
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
