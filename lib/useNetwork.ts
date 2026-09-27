"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_NETWORK,
  NETWORK_PARAM,
  readNetwork,
  withNetwork,
  type NetworkId,
} from "./network";

export interface UseNetwork {
  /** The network the current URL selects. */
  network: NetworkId;
  /** Move to another one, leaving everything else about the URL alone. */
  setNetwork: (network: NetworkId) => void;
}

/**
 * The URL is the selected network.
 *
 * There is no store, no context and no `localStorage` mirror: the query string
 * already survives navigation, a refresh, the back button and being pasted
 * into a chat client, and a second copy of the selection somewhere else is a
 * second thing that can disagree with the address bar. Every reader goes
 * through this hook, so every reader sees the same value.
 *
 * `replace` rather than `push`: the network is a property of the page you are
 * on, not a step in a journey, so switching should not add a history entry the
 * back button has to walk through. `scroll: false` keeps the reader where they
 * were — Next would otherwise treat the navigation as a fresh page and jump to
 * the top.
 *
 * Must be rendered inside a `<Suspense>` boundary: `useSearchParams` suspends
 * while the URL is being read during prerendering.
 */
export function useNetwork(): UseNetwork {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();
  const current = search ? `${pathname}?${search}` : pathname;
  const network = readNetwork(searchParams);

  // The URL is the source of truth, which also makes it worth keeping in its
  // canonical form: `?network=mainnet` says the same thing as no parameter at
  // all, `?network=TESTNET` says the same thing as `?network=testnet`, and
  // `?network=lolnet` says nothing anyone can honour. Correcting the address
  // bar here means a link that was shared while it was still wrong — or that
  // someone typed by hand — ends up pointing at the canonical page.
  const raw = searchParams.get(NETWORK_PARAM);
  const canonical = network === DEFAULT_NETWORK ? null : network;
  useEffect(() => {
    if (raw !== canonical) {
      router.replace(withNetwork(current, network), { scroll: false });
    }
  }, [raw, canonical, current, network, router]);

  const setNetwork = useCallback(
    (next: NetworkId) => {
      router.replace(withNetwork(current, next), { scroll: false });
    },
    [current, router],
  );

  return { network, setNetwork };
}
