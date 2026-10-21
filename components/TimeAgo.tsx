"use client";

import { useSyncExternalStore } from "react";
import { timeAgo, absoluteTime } from "@/lib/formatters";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function TimeAgo({ isoString }: { isoString: string }) {
  // The ISO value is identical across clocks, locales and time zones during
  // hydration. Local relative/absolute formatting starts after hydration.
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  if (!hydrated) return <time dateTime={isoString} title={isoString}>{isoString}</time>;
  const absolute = absoluteTime(isoString);
  return <time dateTime={isoString} title={`${absolute} (your local timezone)`} aria-label={`${timeAgo(isoString)}; ${absolute} (your local timezone)`}>{timeAgo(isoString)}</time>;
}
