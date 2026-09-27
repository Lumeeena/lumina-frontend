'use client';

import { useState } from "react";

type CopyState = "idle" | "copied" | "failed";

async function copyToClipboard(text: string): Promise<boolean> {
  // Secure context: Clipboard API available
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback
    }
  }

  // Insecure context fallback (plain HTTP, older browsers)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function CopyAddressButton({ address }: { address: string }) {
  const [state, setState] = useState<CopyState>("idle");

  async function copyAddress() {
    const ok = await copyToClipboard(address);
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      onClick={copyAddress}
      className="bg-[#f6f5f8] border border-[#e5e3ea] hover:border-[#c4b5fd] font-semibold text-[11px] px-2.5 py-[5px] rounded-[7px] shrink-0 transition-colors"
    >
      {state === "copied" ? "Copied!" : state === "failed" ? "Failed" : "Copy"}
    </button>
  );
}
