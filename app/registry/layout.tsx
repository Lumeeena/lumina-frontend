import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";
import { REGISTRY } from "@/lib/routes";

// The registry page is a client component, and `metadata` can only be exported
// from a server component — so the page's metadata lives here, in the segment's
// layout, which is the documented way to give a client page a title.
export const metadata: Metadata = routeMetadata(REGISTRY);

export default function RegistryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
