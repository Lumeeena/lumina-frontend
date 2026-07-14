import Link from "next/link";
import { Database, Search, Code } from "lucide-react";
import { getLatestLedger } from "@/lib/horizon";
import StatCard from "@/components/StatCard";
import LiveFeed from "@/components/LiveFeed";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const ledger = await getLatestLedger();

  return (
    <div className="flex flex-col">
      <section className="py-16 px-6 border-b border-[#162032]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-700/50 text-cyan-400 text-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Live · Stellar Mainnet
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Stellar Network Data, <span className="text-cyan-400">Illuminated</span>
              </h1>
              <p className="text-slate-400 leading-relaxed mb-6">
                Lumina indexes Stellar network events in real time and exposes them through a developer-friendly GraphQL API. Query transactions, operations, accounts, and Soroban contract events with ease.
              </p>
              <div className="flex gap-3">
                <Link href="/explorer" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition-colors">Open Explorer</Link>
                <Link href="/graphql" className="px-5 py-2.5 border border-[#162032] hover:border-cyan-700 text-slate-300 rounded-lg font-semibold text-sm transition-colors">GraphQL Playground</Link>
              </div>
            </div>
            <div className="lg:w-[400px] shrink-0">
              <form action="/accounts" method="get" className="flex gap-2">
                <input name="address" placeholder="Search Stellar address (G...)" className="flex-1 bg-[#0c1222] border border-[#162032] text-sm text-slate-200 placeholder-slate-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-600 mono" />
                <button type="submit" className="px-4 py-2.5 bg-cyan-700 hover:bg-cyan-600 rounded-lg transition-colors text-white text-sm font-semibold">Search</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 border-b border-[#162032] bg-[#060d18]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Latest Ledger" value={ledger ? ledger.sequence.toLocaleString() : "—"} subtitle="Stellar Mainnet" />
            <StatCard title="Txs (last ledger)" value={ledger ? (ledger.successful_transaction_count + ledger.failed_transaction_count).toLocaleString() : "—"} subtitle="Successful + failed" />
            <StatCard title="Ops (last ledger)" value={ledger ? ledger.operation_count.toLocaleString() : "—"} subtitle="All operation types" />
            <StatCard title="Ledger Time" value={ledger ? new Date(ledger.closed_at).toLocaleTimeString() : "—"} subtitle="UTC close time" />
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-4">Live Transaction Feed</h2>
            <LiveFeed />
          </div>
          <div className="lg:w-64 shrink-0 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white">Quick Access</h2>
            {[
              { href: "/explorer", icon: <Search size={16} />, label: "Account Explorer", desc: "Search any Stellar account" },
              { href: "/transactions", icon: <Database size={16} />, label: "All Transactions", desc: "Browse recent transactions" },
              { href: "/graphql", icon: <Code size={16} />, label: "GraphQL Playground", desc: "Query the Lumina API" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="p-4 rounded-xl bg-[#0c1222] border border-[#162032] hover:border-cyan-800 transition-colors group">
                <div className="flex items-center gap-2 mb-1 text-cyan-400 group-hover:text-cyan-300">{item.icon}<span className="text-sm font-semibold">{item.label}</span></div>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
