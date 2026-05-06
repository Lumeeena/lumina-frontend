import Link from "next/link";
import { Database } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-[#162032] bg-[#030712]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-cyan-400 hover:text-cyan-300 transition-colors">
          <Database size={18} />
          Lumina
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <Link href="/explorer" className="hover:text-slate-200 hover:underline underline-offset-4 transition-colors">Explorer</Link>
          <Link href="/transactions" className="hover:text-slate-200 hover:underline underline-offset-4 transition-colors">Transactions</Link>
          <Link href="/graphql" className="hover:text-slate-200 hover:underline underline-offset-4 transition-colors">GraphQL</Link>
          <span className="px-2.5 py-1 rounded-full bg-cyan-900/30 border border-cyan-700/50 text-cyan-400 text-xs font-semibold">
            Stellar Mainnet
          </span>
        </div>
      </div>
    </nav>
  );
}
