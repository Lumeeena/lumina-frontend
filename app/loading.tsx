import RouteSkeleton from "@/components/RouteSkeleton";

/**
 * Shown while the home page waits on the latest-ledger read. The page itself
 * renders the moment that one query resolves, and shows an em dash for the
 * figures if the API is unreachable.
 */
export default function Loading() {
  return <RouteSkeleton label="Loading the latest ledger" cards={4} rows={2} />;
}
