export default function Footer() {
  return (
    <footer className="border-t border-[#e5e3ea] py-6 text-center text-sm text-[#a6a3b0]">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
        <span className="text-xs text-[#6b6975]">Stellar Mainnet · Live</span>
      </div>
      Lumina &middot; Stellar Event Indexer &middot; Open Source &middot; MIT License
    </footer>
  );
}
