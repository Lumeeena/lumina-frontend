"use client";

import { useCallback, useEffect, useState } from "react";
import {
  VAPID_PUBLIC_KEY,
  currentPushState,
  disablePush,
  enablePush,
  type PushState,
} from "@/lib/pushNotifications";

/**
 * Explicit opt-in to browser push. Part of #9 / #82.
 *
 * Nothing is requested until this button is pressed. That is the whole design:
 * a permission prompt on page load is the fastest way to get a site blocked
 * permanently, and browsers treat it as hostile. So the default state of this
 * component is "off, and here is the button", and the request happens inside
 * the click handler where a user gesture is still live.
 */
export default function PushOptIn() {
  const [state, setState] = useState<PushState>("default");
  const [busy, setBusy] = useState(false);

  // Reads the current state on mount, which never prompts — `permission` is a
  // read and `getSubscription` is a lookup, not a request.
  useEffect(() => {
    let cancelled = false;
    void currentPushState().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = useCallback(async () => {
    setBusy(true);
    try {
      setState(await enablePush());
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDisable = useCallback(async () => {
    setBusy(true);
    try {
      setState(await disablePush());
    } finally {
      setBusy(false);
    }
  }, []);

  if (state === "unsupported") {
    return (
      <p className="text-[13px] text-[var(--color-text-secondary)]" data-testid="push-state">
        This browser cannot deliver notifications for watched activity. The
        in-app alerts still work.
      </p>
    );
  }

  if (state === "denied") {
    // A refusal is final from the browser's side, so the honest thing is to say
    // where to change it rather than offer a button that cannot work.
    return (
      <p className="text-[13px] text-[var(--color-text-secondary)]" data-testid="push-state">
        Notifications are blocked for this site. Re-enable them in your
        browser&apos;s site settings to get alerts while this tab is in the
        background. The in-app alerts are unaffected.
      </p>
    );
  }

  if (state === "subscribed") {
    return (
      <div
        className="flex flex-wrap items-center gap-3"
        data-testid="push-state"
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Browser notifications are on. You will be notified when a watched
          address is active and this tab is in the background.
        </p>
        <button
          type="button"
          onClick={handleDisable}
          disabled={busy}
          className="rounded-lg border border-[var(--color-border-default)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
        >
          Turn off
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="push-state">
      <p className="text-[13px] text-[var(--color-text-secondary)]">
        {VAPID_PUBLIC_KEY
          ? "Get a browser notification when a watched address is active and this tab is in the background."
          : "Browser notifications need a VAPID public key. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY to enable them — the in-app alerts work without it."}
      </p>
      <button
        type="button"
        onClick={handleEnable}
        disabled={busy}
        data-testid="push-enable"
        className="rounded-lg bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] disabled:opacity-50 text-white font-bold text-[13px] px-4 py-2 transition-colors"
      >
        {busy ? "Enabling…" : "Enable notifications"}
      </button>
    </div>
  );
}
