"use client";

import { useCallback, useEffect } from "react";
import { useWatchedActivity, type WatchActivity } from "@/lib/useWatchedActivity";
import { recordActivity } from "@/lib/notifications";
import { notifyWhileUnfocused } from "@/lib/pushNotifications";
import { truncateAddress } from "@/lib/formatters";

/**
 * Keeps the watch alerts running on every route. Part of #9 / #81 and / #82.
 *
 * Mounted in the root layout rather than on the watch page, which is the whole
 * point of the issue: a watch that only fires while you are looking at the feed
 * is not a watch. From here the subscriptions for every watched address are
 * open on any page, and a matching operation is recorded in the notification
 * store that the nav bell reads.
 *
 * Renders nothing. It is a side-effect component and saying so in its own
 * output would be the only thing visible.
 */
export default function WatchActivityWatcher() {
  const handleAlert = useCallback((activity: WatchActivity) => {
    recordActivity(activity.address, activity.operation);
    // Only when the tab is not being watched. The panel and the bell have
    // already recorded the alert by this point, so this is a second channel
    // rather than the only one.
    void notifyWhileUnfocused(
      {
        id: activity.id,
        address: activity.address,
        transactionHash: activity.operation.transactionHash,
      },
      `Activity on ${truncateAddress(activity.address, 5)}`,
      describe(activity),
    );
  }, []);

  useWatchedActivity(handleAlert);

  // The tab has to be able to receive a push event at all before one is worth
  // requesting, so the worker is registered silently on mount. Registration
  // shows nothing and asks for nothing — unlike `Notification.requestPermission`,
  // which is only ever reached from the opt-in button on the watch page.
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }
    let cancelled = false;
    void import("@/lib/pushNotifications").then(({ registerServiceWorker }) => {
      if (!cancelled) void registerServiceWorker();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

function describe(activity: WatchActivity): string {
  const { operation } = activity;
  const type = operation.type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
  if (operation.amount === null) return type;
  return `${type} · ${operation.amount} ${operation.asset ?? "XLM"}`;
}
