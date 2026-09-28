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

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <p className="text-5xl font-extrabold text-[var(--color-accent-text)] mb-4">{t("notFound.code")}</p>
      <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{t("notFound.title")}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        {t("notFound.body")}
      </p>

      <Link
        href="/explorer"
        className="inline-block px-5 py-2.5 bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white rounded-lg text-sm font-semibold transition-colors mb-10"
      >
        {t("notFound.openExplorer")}
      </Link>

      <div className="border-t border-[var(--color-border-default)] pt-8">
        <p className="text-xs text-[var(--color-text-faint)] uppercase tracking-widest mb-4">{t("notFound.orGoTo")}</p>
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
