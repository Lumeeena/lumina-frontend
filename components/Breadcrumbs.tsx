import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs navigation for detail pages.
 *
 * Provides a navigation landmark showing the user's location in the app
 * hierarchy. The final item is the current page (no link). Keyboard accessible.
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4"
    >
      <ol className="flex flex-wrap gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-[var(--color-text-primary)] font-medium">{item.label}</span>
              ) : (
                <>
                  <Link
                    href={item.href || "#"}
                    className="text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-fill)] focus:ring-offset-2 rounded px-1"
                  >
                    {item.label}
                  </Link>
                  <span className="text-[var(--color-text-muted)]" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
