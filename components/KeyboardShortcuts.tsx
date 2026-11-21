"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GO_KEY,
  HELP_KEY,
  isPlainKey,
  ROUTE_SHORTCUTS,
  SEARCH_KEY,
  SEQUENCE_TIMEOUT_MS,
  SHORTCUTS_STORAGE_KEY,
} from "@/lib/shortcuts";
import { Dialog } from "@/components/ui/Dialog";

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(SHORTCUTS_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const awaitingGo = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // localStorage does not exist during the server pass.
  useEffect(() => {
    // Hydrate the browser-only preference after SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(readEnabled());
  }, []);

  const toggleEnabled = useCallback((next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(SHORTCUTS_STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Preference just won't persist.
    }
  }, []);

  const openHelp = useCallback(() => {
    setOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    function reset() {
      awaitingGo.current = false;
      clearTimeout(timer.current);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (open && e.key === "Escape") {
        closeHelp();
        return;
      }
      // The help dialog stays reachable even when shortcuts are switched off,
      // but only through its own button; the "?" key is a shortcut like any other.
      if (!enabled || !isPlainKey(e)) return;

      if (awaitingGo.current) {
        const route = ROUTE_SHORTCUTS.find((r) => r.key === e.key);
        reset();
        if (route) {
          e.preventDefault();
          router.push(route.href);
        }
        return;
      }

      if (e.key === GO_KEY) {
        awaitingGo.current = true;
        timer.current = setTimeout(reset, SEQUENCE_TIMEOUT_MS);
      } else if (e.key === SEARCH_KEY) {
        e.preventDefault();
        const field = document.querySelector<HTMLElement>(
          "[data-shortcut-search]",
        );
        if (field) field.focus();
        else router.push("/explorer");
      } else if (e.key === HELP_KEY) {
        e.preventDefault();
        openHelp();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      reset();
    };
  }, [enabled, open, router, openHelp, closeHelp]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openHelp}
        aria-haspopup="dialog"
        className="fixed bottom-4 end-4 z-20 border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold px-3 py-2 rounded-lg shadow-sm"
      >
        Keyboard shortcuts
      </button>

      <Dialog
        open={open}
        onClose={closeHelp}
        title="Keyboard shortcuts"
        triggerRef={triggerRef}
        maxWidth="sm"
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm mb-4">
          <Row keys={SEARCH_KEY} label="Search" />
          <Row keys={HELP_KEY} label="Show this list" />
          {ROUTE_SHORTCUTS.map((r) => (
            <Row
              key={r.key}
              keys={`${GO_KEY} then ${r.key}`}
              label={r.label}
            />
          ))}
        </dl>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Shortcuts never use Ctrl, Cmd or Alt and are ignored while you
          type in a field.
        </p>
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-primary)] mb-4">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggleEnabled(e.target.checked)}
          />
          Enable keyboard shortcuts
        </label>
      </Dialog>
    </>
  );
}

function Row({ keys, label }: { keys: string; label: string }) {
  return (
    <>
      <dt className="mono text-[12px] text-[var(--color-accent-text)]">{keys}</dt>
      <dd className="m-0 text-[var(--color-text-primary)]">{label}</dd>
    </>
  );
}
