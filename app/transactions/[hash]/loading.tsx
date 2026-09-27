import RouteSkeleton from "@/components/RouteSkeleton";

/**
 * Shown while the page reads one transaction. The hash is in the URL but
 * there is nothing to render from it alone, so the skeleton stands in for the
 * stats and the operations list.
 */
export default function Loading() {
  return <RouteSkeleton label="Loading transaction" cards={4} rows={3} />;
}
