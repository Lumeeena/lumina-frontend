"use client";

import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

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

export default function CopyAddressButton({
  address,
  variant = "address",
}: {
  address: string;
  variant?: "address" | "hash";
}) {
  const { addToast } = useToast();

  const ariaLabel =
    variant === "hash" ? t("copy.copyHash") : t("copy.copyAddress");

  async function copyAddress() {
    const ok = await copyToClipboard(address);
    if (ok) {
      addToast({
        type: "success",
        title: variant === "hash" ? t("copy.copiedHash") : t("copy.copiedAddress"),
        duration: 2000,
      });
    } else {
      addToast({
        type: "error",
        title: t("copy.failed"),
        message: "Select and copy the address manually.",
      });
    }
  }

  return (
    <button
      onClick={copyAddress}
      aria-label={ariaLabel}
      className="bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] font-semibold text-[11px] px-2.5 py-[5px] rounded-[7px] shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)] motion-reduce:transition-none"
    >
      {t("copy.copy")}
    </button>
  );
}
