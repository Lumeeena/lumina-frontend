"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Bell } from "lucide-react";
import {
  clearNotifications,
  getServerSnapshot,
  getSnapshot,
  markAllRead,
  subscribeToNotifications,
  type ActivityNotification,
} from "@/lib/notifications";
import { truncateAddress } from "@/lib/formatters";

/** Above this the badge stops being countable at a glance; the panel is exact. */
export const MAX_VISIBLE_BADGE_COUNT = 99;

/**
 * The nav unread indicator and its panel. Part of #9 / #81.
 *
 * Reads the notification store as an external store, so the count in the nav and
 * the list in the panel are the same data rather than two copies kept in sync
 * by hand.
 */
export default function ActivityBell() {
  const notifications = useSyncExternalStore(
    subscribeToNotifications,
    getSnapshot,
    getServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelId = "activity-panel";

  const unread = notifications.reduce(
    (total, item) => (item.read ? total : total + 1),
    0,
  );

  // A click anywhere else closes the panel. Without this it would stay open
  // across navigation, which is the behaviour that makes a dropdown feel stuck.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Opening the panel is what marks the items read, so the count drops as a
  // consequence of having looked rather than of a separate action.
  const handleOpen = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen) markAllRead();
      return !wasOpen;
    });
  }, []);

  const handleClear = useCallback(() => {
    clearNotifications();
    setOpen(false);
  }, []);

  return (
    <div className="relative ml-auto shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          unread === 0
            ? "Watched address alerts"
            : `Watched address alerts, ${unread} unread`
        }
        data-testid="activity-bell"
        className="relative inline-flex items-center justify-center size-8 rounded-lg text-[#6b6975] hover:bg-[#f6f5f8] hover:text-[#0e0e12] transition-colors"
      >
        <Bell aria-hidden="true" className="size-4" strokeWidth={2} />
        {unread > 0 && (
          <span
            data-testid="activity-bell-count"
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#dc2626] text-white text-[10px] font-bold leading-4 text-center tabular-nums"
          >
            {unread > MAX_VISIBLE_BADGE_COUNT ? `${MAX_VISIBLE_BADGE_COUNT}+` : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          data-testid="activity-panel"
          className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[#e5e3ea] bg-white shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0eff3]">
            <h2 className="text-[13px] font-extrabold text-[#0e0e12]">
              Watched activity
            </h2>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-semibold text-[#6b6975] hover:text-[#0e0e12] hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[#a6a3b0]">
              Nothing yet. Alerts appear here when a watched address is active.
            </p>
          ) : (
            <ul className="max-h-[min(24rem,60vh)] overflow-y-auto divide-y divide-[#f0eff3]">
              {notifications.map((item) => (
                <NotificationRow key={item.id} notification={item} />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* The badge is a coloured dot with a number in it, so the count is also
          announced. Polite, because an arriving alert should not interrupt. */}
      <span className="sr-only" role="status" aria-live="polite">
        {unread === 0
          ? "No unread watched activity"
          : `${unread} unread watched ${unread === 1 ? "alert" : "alerts"}`}
      </span>
    </div>
  );
}

function NotificationRow({ notification }: { notification: ActivityNotification }) {
  return (
    <li className="px-4 py-3" data-testid="activity-notification">
      <a
        href={`/accounts/${notification.address}`}
        className="block hover:underline"
      >
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-semibold rounded-full bg-[#f3effe] text-[#6d28d9] px-2 py-0.5">
            {notification.operationType}
          </span>
          <span className="mono text-[11px] text-[#6b6975]">
            {truncateAddress(notification.address, 4)}
          </span>
        </span>
        <span className="mt-1 block text-[12px] text-[#0e0e12]">
          {notification.amount === null
            ? "Operation on a watched address"
            : `${notification.amount} ${notification.asset ?? "XLM"}`}
        </span>
      </a>
    </li>
  );
}
