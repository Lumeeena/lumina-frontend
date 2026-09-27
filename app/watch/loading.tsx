import RouteSkeleton from "@/components/RouteSkeleton";

/**
 * The watch page is entirely browser state — localStorage and a live
 * subscription — so there is nothing to wait for on the server. The skeleton
 * exists to keep the layout from jumping while that state hydrates, not because
 * a request is in flight.
 */
export default function WatchLoading() {
  return <RouteSkeleton label="Loading your watch list" />;
}
