import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";
import { GRAPHQL } from "@/lib/routes";

// The playground itself is a client component, and `metadata` can only be
// exported from a server component — so the page's metadata lives here, in the
// segment's layout, which is the documented way to give a client page a title.
export const metadata: Metadata = routeMetadata(GRAPHQL);

export default function GraphQLLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
