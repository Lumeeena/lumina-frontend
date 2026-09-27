import Link from "next/link";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/transactions", label: "Transactions" },
  { href: "/events", label: "Events" },
  { href: "/graphql", label: "GraphQL" },
  { href: "/registry", label: "Registry" },
  { href: "/stats", label: "Stats" },
];

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <p className="text-5xl font-extrabold text-[#8b5cf6] mb-4">404</p>
      <p className="text-lg font-semibold text-[#0e0e12] mb-2">Page not found</p>
      <p className="text-sm text-[#6b6975] mb-8">
        That address, hash, or route doesn&apos;t exist. Double-check the URL or use the Explorer to look up an account or transaction.
      </p>

      <Link
        href="/explorer"
        className="inline-block px-5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg text-sm font-semibold transition-colors mb-10"
      >
        Open Explorer
      </Link>

      <div className="border-t border-[#e5e3ea] pt-8">
        <p className="text-xs text-[#c3c1cb] uppercase tracking-widest mb-4">Or go to</p>
        <div className="flex flex-wrap justify-center gap-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-[13.5px] font-semibold rounded-lg text-[#6b6975] hover:text-[#0e0e12] bg-[#f6f5f8] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
