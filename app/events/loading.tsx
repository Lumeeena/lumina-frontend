import RouteSkeleton from "@/components/RouteSkeleton";

/** Shown while the events page waits on the contract's indexed events. */
export default function Loading() {
  return <RouteSkeleton label="Loading contract events" rows={4} filters={1} />;
}
