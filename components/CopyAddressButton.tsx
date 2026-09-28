'use client';

import { useState } from "react";
import { t } from "@/lib/i18n";

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
      className="bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] font-semibold text-[11px] px-2.5 py-[5px] rounded-[7px] shrink-0 transition-colors"
    >
      {state === "copied" ? t("copy.copied") : state === "failed" ? t("copy.failed") : t("copy.copy")}
    </button>
  );
}
