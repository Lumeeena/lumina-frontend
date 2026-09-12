"use client";

import type { ConnectionState } from "@/lib/subscriptions";

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

const TITLE: Record<ConnectionState, string> = {
  idle: "Not connected yet",
  connecting: "Opening a live connection",
  connected: "Streaming live updates",
  reconnecting: "Connection lost — retrying",
  disconnected: "Live connection unavailable — falling back to periodic refresh",
  unsupported: "Live updates unavailable here — falling back to periodic refresh",
};

export default function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const { label, dot, ring, pulse } = PRESENTATION[state];

  return (
    <div
      className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#0e0e12]"
      title={TITLE[state]}
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
      {label}
    </div>
  );
}
