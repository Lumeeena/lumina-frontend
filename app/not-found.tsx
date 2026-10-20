import Link from "next/link";
import { t } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/transactions", label: "Transactions" },
  { href: "/events", label: "Events" },
  { href: "/graphql", label: "GraphQL" },
  { href: "/registry", label: "Registry" },
  { href: "/stats", label: "Stats" },
];

const HELP_ITEMS = [
  {
    title: "Search for an account",
    description: "Enter a Stellar address or public key",
    href: "/explorer",
  },
  {
    title: "Browse transactions",
    description: "View all recent network activity",
    href: "/transactions",
  },
  {
    title: "Check contract events",
    description: "Monitor Soroban contract executions",
    href: "/events",
  },
  {
    title: "Use GraphQL",
    description: "Query the Lumina API directly",
    href: "/graphql",
  },
];

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <p className="text-5xl font-extrabold text-[var(--color-accent-text)] mb-4">{t("notFound.code")}</p>
        <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{t("notFound.title")}</p>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-8">
          {t("notFound.body")}
        </p>

        <Link
          href="/explorer"
          className="inline-block px-5 py-2.5 bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {t("notFound.openExplorer")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {HELP_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="p-4 border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] rounded-xl bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-raised)] transition-colors group"
          >
            <div className="font-semibold text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-text)]">
              {item.title}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              {item.description}
            </div>
          </Link>
        ))}
      </div>

      <div className="border-t border-[var(--color-border-default)] pt-8">
        <p className="text-xs text-[var(--color-text-faint)] uppercase tracking-widest mb-4 text-center">{t("notFound.orGoTo")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-[13.5px] font-semibold rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-raised)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
