"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import type { ConnectionState, FailureReason } from "@/lib/subscriptions";
import { t } from "@/lib/i18n";

const LABEL_KEYS: Record<ConnectionState, Parameters<typeof t>[0]> = {
  idle: "connection.idle",
  connecting: "connection.connecting",
  connected: "connection.live",
  reconnecting: "connection.reconnecting",
  disconnected: "connection.polling",
  unsupported: "connection.polling",
};

const DOT_STYLE: Record<ConnectionState, { dot: string; ring: string; pulse: boolean }> = {
  idle: { dot: "bg-[var(--color-text-faint)]", ring: "var(--color-text-faint)", pulse: false },
  connecting: { dot: "bg-[var(--color-warning-text)]", ring: "var(--color-warning-text)", pulse: true },
  connected: { dot: "bg-[var(--color-success-text)]", ring: "var(--color-success-text)", pulse: false },
  reconnecting: { dot: "bg-[var(--color-warning-text)]", ring: "var(--color-warning-text)", pulse: true },
  disconnected: { dot: "bg-[var(--color-text-muted)]", ring: "var(--color-text-muted)", pulse: false },
  unsupported: { dot: "bg-[var(--color-text-muted)]", ring: "var(--color-text-muted)", pulse: false },
};

const EXPLANATION_KEYS: Record<ConnectionState, Parameters<typeof t>[0]> = {
  idle: "connection.explainIdle",
  connecting: "connection.explainConnecting",
  connected: "connection.explainConnected",
  reconnecting: "connection.explainReconnecting",
  disconnected: "connection.explainDisconnected",
  unsupported: "connection.explainUnsupported",
};

const REASON_KEYS: Partial<Record<ConnectionState, Parameters<typeof t>[0]>> = {
  unsupported: "connection.reasonUnsupported",
};

const FAILURE_KEYS: Record<FailureReason, Parameters<typeof t>[0]> = {
  unreachable: "connection.reasonUnreachable",
  refused: "connection.reasonRefused",
};

interface ConnectionIndicatorProps {
  state: ConnectionState;
  failureReason?: FailureReason | null;
  /** When given, a retry is offered while the feed is polling. */
  onRetry?: () => void;
}

export default function ConnectionIndicator({ state, failureReason = null, onRetry }: ConnectionIndicatorProps) {
  const label = t(LABEL_KEYS[state]);
  const { dot, ring, pulse } = DOT_STYLE[state];
  const reasonKey = state === "disconnected" && failureReason ? FAILURE_KEYS[failureReason] : REASON_KEYS[state];
  const reason = reasonKey ? t(reasonKey) : undefined;
  const [expanded, setExpanded] = useState(false);
  const explanationId = useId();

  return (
    <div
      className="relative flex items-center gap-2 text-xs font-bold tracking-wide text-[var(--color-text-primary)]"
      role="status"
      aria-live="polite"
      data-testid="connection-indicator"
      data-state={state}
    >
      <span
        aria-hidden="true"
        className={`w-[7px] h-[7px] rounded-full ${dot} ${pulse ? "animate-pulse motion-reduce:animate-none" : ""}`}
        style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${ring} 15%, transparent)` }}
      />
      <span data-testid="connection-label">
        {label}
        {reason && (
          <span
            className="font-normal text-[11px] text-[var(--color-text-muted)]"
            data-testid="connection-reason"
          >
            {reason}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={explanationId}
        aria-label={t("connection.whatDoesMean", { label })}
        onClick={() => setExpanded((open) => !open)}
        className="relative inline-flex size-7 shrink-0 select-none items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
      >
        <Info aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
        <span
          className="absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
          aria-hidden="true"
        />
      </button>
      {state === "disconnected" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="relative select-none font-medium text-[0.6875rem] text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
        >
          {t("error.retry")}
          <span
            className="absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
            aria-hidden="true"
          />
        </button>
      )}
      <p
        id={explanationId}
        hidden={!expanded}
        className="absolute start-0 top-full z-20 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-3 text-sm/5 font-normal tracking-normal text-[var(--color-text-secondary)] shadow-lg"
      >
        {t(EXPLANATION_KEYS[state])}
      </p>
    </div>
  );
}
