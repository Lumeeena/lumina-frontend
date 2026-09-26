import { timeAgo, absoluteTime } from "@/lib/formatters";

export default function TimeAgo({ isoString }: { isoString: string }) {
  const absolute = absoluteTime(isoString);
  return <time dateTime={isoString} title={`${absolute} (your local timezone)`} aria-label={`${timeAgo(isoString)}; ${absolute} (your local timezone)`}>{timeAgo(isoString)}</time>;
}
