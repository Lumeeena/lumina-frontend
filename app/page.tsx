import Link from "next/link";
import { LatestLedgerDocument as LATEST_LEDGER_QUERY } from "@/lib/generated/graphql";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { shareCard } from "@/lib/metadata";
import { DEFAULT_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import type { Ledger } from "@/lib/types";
import StatCard from "@/components/StatCard";
import SearchBar from "@/components/SearchBar";
import LiveFeed from "@/components/LiveFeed";
import BackendUnavailable from "@/components/BackendUnavailable";

export const metadata: Metadata = {
  // `absolute` because this is the route the title template's own default
  // describes: appending the brand to a title that already carries it would
  // read "Lumina — Stellar Data Layer — Lumina".
  title: { absolute: SITE_TITLE },
  description: DEFAULT_DESCRIPTION,
  ...shareCard({
    label: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  }),
};

async function getLatestLedger(): Promise<{
  ledger: Ledger | null;
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, LATEST_LEDGER_QUERY);
    return { ledger: data.latestLedger, unavailable: false };
  } catch {
    return { ledger: null, unavailable: true };
  }
}

const QUICK_LINKS = [
  {
    href: "/explorer",
    label: "Account Explorer",
    desc: "Search any Stellar account",
    prefetch: true,
  },
  {
    href: "/transactions",
    label: "All Transactions",
    desc: "Browse recent transactions",
    prefetch: true,
  },
  {
    href: "/events",
    label: "Contract Events",
    desc: "Soroban events by contract",
    prefetch: false,
  },
  {
    href: "/graphql",
    label: "GraphQL Playground",
    desc: "Query the Lumina API",
    prefetch: false,
  },
  {
    href: "/registry",
    label: "Registry",
    desc: "Register a contract for indexing",
    prefetch: false,
  },
];

export default async function Home() {
  const result = await getLatestLedger();
  const ledger = result.ledger;

  return (
    <div>
      <section className="px-4 sm:px-7 pt-14 sm:pt-20 pb-10 sm:pb-14 border-b border-[var(--color-border-default)]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-14 items-start">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-accent-text)] bg-[var(--color-accent-surface)] px-3 py-1.5 rounded-full mb-6">
              Open-source · Live indexer
            </div>
            <h1 className="font-extrabold text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-5 text-[var(--color-text-primary)]">
              Stellar network data,
              <br />
              <span className="text-[var(--color-accent-text)]">illuminated.</span>
            </h1>
            <p className="text-[17px] text-[var(--color-text-secondary)] max-w-[54ch] mb-7 leading-relaxed">
              Lumina polls Stellar Horizon, indexes ledgers, transactions,
              operations, accounts and Soroban contract events into Postgres,
              and serves it all through a typed GraphQL API.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/explorer"
                className="bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white font-bold text-sm px-[22px] py-[13px] rounded-lg shadow-[0_1px_2px_rgba(139,92,246,0.3)] transition-colors"
              >
                Open Explorer
              </Link>
              <Link
                href="/graphql"
                className="bg-[var(--color-bg-base)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] text-[var(--color-text-primary)] font-bold text-sm px-[22px] py-[13px] rounded-lg transition-colors"
              >
                GraphQL Playground
              </Link>
            </div>
          </div>
          <div className="border border-[var(--color-border-default)] rounded-2xl p-[22px] bg-[var(--color-bg-subtle)]">
            <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2.5">
              Search the network
            </div>
            {/* The one search box: it classifies an account, transaction hash
                or contract id by shape and routes to the right page, and sends
                anything unrecognised to the backend's memo search. */}
            <SearchBar />
          </div>
        </div>
      </section>

      {result.unavailable && (
        <div className="max-w-[1160px] mx-auto px-4 sm:px-7 pt-8">
          <BackendUnavailable />
        </div>
      )}
      <section className="px-4 sm:px-7 py-8 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Latest Ledger"
            value={ledger ? ledger.sequence.toLocaleString() : "—"}
            subtitle="Stellar Mainnet"
          />
          <StatCard
            title="Txs (last ledger)"
            value={ledger ? ledger.transactionCount.toLocaleString() : "—"}
            subtitle="Successful + failed"
          />
          <StatCard
            title="Ops (last ledger)"
            value={ledger ? ledger.operationCount.toLocaleString() : "—"}
            subtitle="All operation types"
          />
          <StatCard
            title="Ledger Time"
            value={
              ledger ? new Date(ledger.closedAt).toLocaleTimeString() : "—"
            }
            subtitle="UTC close time"
          />
        </div>
      </section>

      <section className="px-4 sm:px-7 py-10 sm:py-12">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-7 items-start">
          <div>
            <h2 className="font-extrabold text-[17px] mb-3.5 text-[var(--color-text-primary)]">
              Live Transaction Feed
            </h2>
            <LiveFeed />
          </div>
          <div>
            <h2 className="font-extrabold text-[17px] mb-3.5 text-[var(--color-text-primary)]">
              Quick Access
            </h2>
            <div className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-start bg-[var(--color-bg-base)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] rounded-xl p-4 flex flex-col gap-1 transition-colors"
                >
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">
                    {item.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
