import RouteSkeleton from "@/components/RouteSkeleton";

/** Shown while the stats page reads the latest ledger and the registry. */
export default function Loading() {
  return <RouteSkeleton label="Loading network stats" cards={4} rows={3} />;
}
