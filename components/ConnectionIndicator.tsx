"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import type { ConnectionState, FailureReason } from "@/lib/subscriptions";
import { t } from "@/lib/i18n";

/**
 * What each state means to someone looking at a feed that has stopped moving.
 *
 * The distinction that matters is "quiet because nothing is happening" versus
 * "quiet because we lost the server" — a live panel that silently stalls while
 * still showing a green dot is worse than one that never claimed to be live.
 */
const LABEL_KEYS: Record<ConnectionState, Parameters<typeof t>[0]> = {
  idle: "connection.idle",
  connecting: "connection.connecting",
  connected: "connection.live",
  reconnecting: "connection.reconnecting",
  disconnected: "connection.polling",
  unsupported: "connection.polling",
};

const DOT_STYLE: Record<ConnectionState, { dot: string; ring: string; pulse: boolean }> = {
  idle: { dot: "bg-[var(--color-text-faint)]", ring: "rgba(195,193,203,0.15)", pulse: false },
  connecting: { dot: "bg-[var(--color-warning-text)]", ring: "rgba(217,119,6,0.15)", pulse: true },
  connected: { dot: "bg-[var(--color-success-text)]", ring: "rgba(22,163,74,0.15)", pulse: false },
  reconnecting: { dot: "bg-[var(--color-warning-text)]", ring: "rgba(217,119,6,0.15)", pulse: true },
  disconnected: { dot: "bg-[var(--color-text-muted)]", ring: "rgba(166,163,176,0.15)", pulse: false },
  unsupported: { dot: "bg-[var(--color-text-muted)]", ring: "rgba(166,163,176,0.15)", pulse: false },
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
      // `relative` so the expanded explanation is positioned against this
      // status line rather than against whatever ancestor happens to be laid out.
      className="relative flex items-center gap-2 text-xs font-bold tracking-wide text-[var(--color-text-primary)]"
      // Announced politely so a reconnect is heard without interrupting, and
      // exposed as status text rather than only as a coloured dot.
      role="status"
      aria-live="polite"
      data-testid="connection-indicator"
      data-state={state}
    >
      <span
        className={`w-[7px] h-[7px] rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`}
        style={{ boxShadow: `0 0 0 3px ${ring}` }}
      />
      {/* The reason sits inside the label rather than beside it: the two are one
          statement ("POLLING, server unreachable") and reading them as
          separate fragments loses that. */}
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
      {/* Available in every state. A green LIVE dot that has quietly stalled is
          the exact thing this component exists to rule out, so the way to ask
          "is this actually current?" cannot depend on already suspecting it. */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={explanationId}
        aria-label={t("connection.whatDoesMean", { label })}
        onClick={() => setExpanded((open) => !open)}
        className="relative inline-flex size-7 shrink-0 select-none items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-primary)]"
      >
        <Info aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
        <span
          className="absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
          aria-hidden="true"
        />
      </button>

      {/* Only offered once the client has actually given up. A retry while it is
          still backing off would just queue a second attempt behind the first. */}
      {state === "disconnected" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="relative select-none font-medium text-[0.6875rem] text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline"
        >
          {t("error.retry")}
          <span
            className="absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
            aria-hidden="true"
          />
        </button>
      )}

      {expanded && (
        <p
          id={explanationId}
          className="absolute start-0 top-full z-20 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-3 text-sm/5 font-normal tracking-normal text-[var(--color-text-secondary)] shadow-lg"
        >
          {t(EXPLANATION_KEYS[state])}
        </p>
      )}
    </div>
  );
}
