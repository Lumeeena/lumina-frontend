export default function Footer() {
  return (
    <footer className="border-t border-[#162032] py-6 text-center text-sm text-slate-600">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-slate-500">Stellar Mainnet · Live</span>
      </div>
      Lumina &middot; Stellar Event Indexer &middot; Open Source &middot; MIT License
    </footer>
  );
}
