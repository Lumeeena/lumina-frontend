'use client';

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ROUTES } from "@/lib/routes";
import { DEFAULT_NETWORK, withNetwork, type NetworkId } from "@/lib/network";
import { useNetwork } from "@/lib/useNetwork";
import NetworkSwitcher from "./NetworkSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * The nav for one network: the wordmark, the section links, and optionally the
 * switcher between them.
 *
 * Every link carries the network it was rendered on, which is what makes the
 * selection survive navigation: a link someone shared while looking at testnet
 * keeps showing testnet pages as the reader moves around the app, instead of
 * quietly reverting to the default the moment they click anything. On the
 * default network `withNetwork` writes nothing, so the hrefs here are the ones
 * the app has always emitted.
 */
function NavContent({
  network,
  pathname,
  switcher,
}: {
  network: NetworkId;
  pathname: string;
  switcher?: React.ReactNode;
}) {
  return (
    <>
      <Link
        href={withNetwork("/", network)}
        className="flex items-center gap-2 me-4 sm:me-7 shrink-0"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" className="stroke-[var(--color-accent-text)]" strokeWidth="2" />
          <circle cx="17" cy="7" r="3.4" className="fill-[var(--color-accent-fill)]" />
        </svg>
        <span className="font-extrabold text-[17px] tracking-tight text-[var(--color-text-primary)]">Lumina</span>
      </Link>

      {switcher}

      {/* Labels come from the route inventory, which the sitemap is built from,
          so the nav and the sitemap cannot disagree about what exists. */}
      {NAV_ROUTES.map(route => {
        const active = pathname === route.path || pathname.startsWith(`${route.path}/`);
        return (
          <Link
            key={route.path}
            href={withNetwork(route.path, network)}
            prefetch={route.prefetch ?? false}
            className={`px-3.5 py-2 text-[13.5px] font-semibold rounded-lg whitespace-nowrap transition-colors ${
              active
                ? "text-[var(--color-text-primary)] bg-[var(--color-bg-raised)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {route.label}
          </Link>
        );
      })}
    </>
  );
}

/** The nav once the network in the URL has been read. */
function RoutedNavContent({ pathname }: { pathname: string }) {
  const { network } = useNetwork();
  return <NavContent network={network} pathname={pathname} switcher={<NetworkSwitcher />} />;
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 px-4 sm:px-7 h-[60px] border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)]/90 backdrop-blur sticky top-0 z-20 overflow-x-auto">
      {/* The links and the switcher both read the network from the URL, and
          `useSearchParams` suspends while the URL is being read, so reading
          happens behind one boundary. The fallback is the same nav on the
          default network — the server HTML is a complete, working nav rather
          than an empty one that fills in after hydration. */}
      <Suspense fallback={<NavContent network={DEFAULT_NETWORK} pathname={pathname} />}>
        <RoutedNavContent pathname={pathname} />
      </Suspense>

      {/* Push the toggle to the far right */}
      <div className="ms-auto shrink-0">
        <ThemeToggle />
      </div>
    </nav>
  );
}

