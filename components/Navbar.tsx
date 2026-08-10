'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/transactions", label: "Transactions" },
  { href: "/events", label: "Contract Events" },
  { href: "/graphql", label: "GraphQL" },
  { href: "/registry", label: "Registry" },
  { href: "/stats", label: "Stats" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 px-4 sm:px-7 h-[60px] border-b border-[#e5e3ea] bg-white/90 backdrop-blur sticky top-0 z-20 overflow-x-auto">
      <Link href="/" className="flex items-center gap-2 mr-4 sm:mr-7 shrink-0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#7c3aed" strokeWidth="2" />
          <circle cx="17" cy="7" r="3.4" fill="#8b5cf6" />
        </svg>
        <span className="font-extrabold text-[17px] tracking-tight text-[#0e0e12]">Lumina</span>
      </Link>

      {NAV_ITEMS.map(item => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3.5 py-2 text-[13.5px] font-semibold rounded-lg whitespace-nowrap transition-colors ${
              active ? "text-[#0e0e12] bg-[#f6f5f8]" : "text-[#6b6975] hover:text-[#0e0e12]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      <span className="ml-auto shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1.5 rounded-full bg-[#f0fdf4] text-[#16a34a]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
        MAINNET
      </span>
    </nav>
  );
}
