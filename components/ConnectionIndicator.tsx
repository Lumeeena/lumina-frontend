"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import type { ConnectionState, FailureReason } from "@/lib/subscriptions";

/**
 * What each state means to someone looking at a feed that has stopped moving.
 *
 * The distinction that matters is "quiet because nothing is happening" versus
 * "quiet because we lost the server" — a live panel that silently stalls while
 * still showing a green dot is worse than one that never claimed to be live.
 */
const PRESENTATION: Record<ConnectionState, { label: string; dot: string; ring: string; pulse: boolean }> = {
  idle: { label: "IDLE", dot: "bg-[#c3c1cb]", ring: "rgba(195,193,203,0.15)", pulse: false },
  connecting: { label: "CONNECTING", dot: "bg-[#d97706]", ring: "rgba(217,119,6,0.15)", pulse: true },
  connected: { label: "LIVE", dot: "bg-[#16a34a]", ring: "rgba(22,163,74,0.15)", pulse: false },
  reconnecting: { label: "RECONNECTING", dot: "bg-[#d97706]", ring: "rgba(217,119,6,0.15)", pulse: true },
  disconnected: { label: "POLLING", dot: "bg-[#a6a3b0]", ring: "rgba(166,163,176,0.15)", pulse: false },
  unsupported: { label: "POLLING", dot: "bg-[#a6a3b0]", ring: "rgba(166,163,176,0.15)", pulse: false },
};

const EXPLANATION: Record<ConnectionState, string> = {
  idle: "The feed is waiting to connect. The displayed data may not be current yet.",
  connecting: "A live connection is opening. The feed shows the most recently loaded data until it connects.",
  connected: "Transactions arrive as soon as the server publishes them, so the feed stays current.",
  reconnecting: "The live connection was interrupted. Existing data remains visible while Lumina reconnects.",
  disconnected: "Live updates are unavailable. The feed refreshes every 30 seconds, so data may be up to 30 seconds old.",
  unsupported: "This browser cannot receive live updates. The feed refreshes every 30 seconds, so data may be up to 30 seconds old.",
};

/** Short cause shown next to POLLING, so the fallback reads as designed rather than broken. */
const REASON_TEXT: Partial<Record<ConnectionState, string>> = {
  unsupported: "live updates not supported here",
};

const FAILURE_TEXT: Record<FailureReason, string> = {
  unreachable: "server unreachable",
  refused: "server refused the connection",
};

interface ConnectionIndicatorProps {
  state: ConnectionState;
  failureReason?: FailureReason | null;
  /** When given, a retry is offered while the feed is polling. */
  onRetry?: () => void;
}

export default function ConnectionIndicator({ state, failureReason = null, onRetry }: ConnectionIndicatorProps) {
  const { label, dot, ring, pulse } = PRESENTATION[state];
  const reason = state === "disconnected" && failureReason ? FAILURE_TEXT[failureReason] : REASON_TEXT[state];
  const [expanded, setExpanded] = useState(false);
  const explanationId = useId();

  return (
    <div className="relative min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide text-[#0e0e12]">
        <div
          className="flex min-w-0 items-center gap-2"
          role="status"
          aria-live="polite"
          data-testid="connection-indicator"
          data-state={state}
        >
          <span
            aria-hidden="true"
            className={`size-[7px] shrink-0 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`}
            style={{ boxShadow: `0 0 0 3px ${ring}` }}
          />
          <span>{label}</span>
          {reason && (
            <span className="font-normal text-[0.6875rem] text-[#a6a3b0]" data-testid="connection-reason">
              {reason}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={explanationId}
          aria-label={`What does ${label} mean?`}
          onClick={() => setExpanded(open => !open)}
          className="relative inline-flex size-7 shrink-0 select-none items-center justify-center rounded-md text-[#6b6975] hover:bg-[#f0eff3] hover:text-[#0e0e12]"
        >
          <Info aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
          <span className="absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
        </button>

        {state === "disconnected" && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="relative select-none font-medium text-[0.6875rem] text-[#7c3aed] hover:text-[#6d28d9] hover:underline"
          >
            Retry connection
            <span className="absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
          </button>
        )}
      </div>

      {expanded && (
        <p
          id={explanationId}
          className="absolute left-0 top-full z-20 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-[#e5e3ea] bg-white p-3 text-sm/5 font-normal tracking-normal text-[#6b6975] shadow-lg"
        >
          {EXPLANATION[state]}
        </p>
      )}
    </div>
  );
}
