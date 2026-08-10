'use client';

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";

export default function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={copyAddress} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors shrink-0">
      {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
