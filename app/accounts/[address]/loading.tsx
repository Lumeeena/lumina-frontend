import RouteSkeleton from "@/components/RouteSkeleton";

/**
 * Shown while the account page reads one account. There is nothing to show
 * from the URL alone beyond the address, so the skeleton stands in for the
 * balances and activity lists rather than for a header.
 */
export default function Loading() {
  return <RouteSkeleton label="Loading account" cards={3} rows={3} />;
}
