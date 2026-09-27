import type { Metadata } from "next";
import { WATCHES } from "@/lib/routes";
import { routeMetadata } from "@/lib/metadata";
import WatchedAddressList from "@/components/WatchedAddressList";
import WatchFeed from "@/components/WatchFeed";
import PushOptIn from "@/components/PushOptIn";

export const metadata: Metadata = routeMetadata(WATCHES);

/**
 * The watch page. Part of #9 / #80, / #81, / #82 and / #83.
 *
 * A client page, because every part of it is browser state: the watch list and
 * its filters live in localStorage and the feed is a live subscription. There is
 * nothing here worth server-rendering — an anonymous request has no watches, and
 * rendering the empty state for it would be a flash before the real one.
 */
export default function WatchPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-7 py-10">
      <header className="mb-9">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0e0e12]">
          {WATCHES.label}
        </h1>
        <p className="mt-2 text-[15px] text-[#6b6975]">{WATCHES.description}</p>
      </header>

      <WatchFeed />

      <WatchedAddressList />

      <section
        aria-labelledby="push-heading"
        className="rounded-xl border border-[#e5e3ea] p-5"
      >
        <h2
          id="push-heading"
          className="font-extrabold text-base text-[#0e0e12] mb-1"
        >
          Background notifications
        </h2>
        <p className="mb-4 text-[13px] text-[#6b6975]">
          In-app alerts work everywhere in Lumina. This is the separate opt-in
          for an operating-system notification when the tab is not in front of
          you.
        </p>
        <PushOptIn />
      </section>
    </div>
  );
}
