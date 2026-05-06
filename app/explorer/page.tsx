'use client';

import { useState, useEffect } from "react";
import { getRecentTransactions, HorizonTransaction } from "@/lib/horizon";
import TransactionRow from "@/components/TransactionRow";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExplorerPage() {
  const [txs, setTxs] = useState<HorizonTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const router = useRouter();

  useEffect(() => {
    getRecentTransactions(20).then(data => { setTxs(data); setLoading(false); });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (address.trim()) router.push(`/accounts/${address.trim()}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Explorer</h1>
      <p className="text-slate-400 mb-8">Search any Stellar account or browse the last 20 transactions on the network in real time.</p>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-10">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Enter a Stellar account address (G...)"
          className="flex-1 bg-[#0c1222] border border-[#162032] text-sm text-slate-200 placeholder-slate-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-600 mono"
        />
        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition-colors">
          <Search size={15} /> Search
        </button>
      </form>

      {/* Recent Transactions */}
      <h2 className="text-lg font-bold text-white mb-4">Recent Transactions</h2>
      <div className="rounded-xl bg-[#0c1222] border border-[#162032] overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading transactions from Stellar Horizon...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-[#162032] uppercase tracking-wider">
                <th className="px-4 py-3 w-6" />
                <th className="px-4 py-3">Hash</th>
                <th className="px-4 py-3">Ledger</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Ops</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {txs.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
// Horizon API supports cursor-based pagination for loading more transactions
