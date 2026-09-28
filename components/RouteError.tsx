'use client';

import { useEffect } from "react";
import { t } from "@/lib/i18n";

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
      <p className="text-[var(--color-error-text)] font-semibold mb-2">{t("error.failedToLoadRoute", { route })}</p>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6">
        {t("error.routeRecoveryHint")}
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white rounded-lg text-sm font-semibold transition-colors"
      >
        {t("error.tryAgain")}
      </button>
      {error.digest && (
        <p className="text-xs text-[var(--color-text-faint)] mt-6 mono">{t("error.errorDigest", { digest: error.digest })}</p>
      )}
    </div>
  );
}
