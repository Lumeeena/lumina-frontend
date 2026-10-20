import Link from "next/link";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/registry";
import { getRegistryProfiles } from "@/app/registry/data";
import RegistryEntryCard from "./RegistryEntryCard";
import RegistryRefresh from "./RegistryRefresh";

export default async function RegistryListing({
  category,
}: {
  category: Category | null;
}) {
  let profiles;
  try {
    profiles = await getRegistryProfiles();
  } catch {
    return (
      <div role="alert" className="text-sm text-[var(--color-text-secondary)]">
        <p>Registry data is temporarily unavailable.</p>
        <RegistryRefresh />
      </div>
    );
  }
  const entries = category
    ? profiles.filter((profile) => profile.categories?.includes(category))
    : profiles;
  return (
    <>
      <nav
        className="flex flex-wrap gap-1.5 mb-3.5"
        aria-label="Filter by category"
      >
        {[null, ...CATEGORIES].map((value) => (
          <Link
            key={value ?? "all"}
            href={value ? `/registry?category=${value}` : "/registry"}
            scroll={false}
            prefetch={false}
            aria-current={category === value ? "page" : undefined}
            className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${category === value ? "bg-[var(--color-accent-surface)] border-[var(--color-accent-fill)] text-[var(--color-accent-text)]" : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
          >
            {value ? CATEGORY_LABELS[value] : "All"}
          </Link>
        ))}
      </nav>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {category
            ? `No active ${CATEGORY_LABELS[category]} contracts.`
            : "No contracts registered yet."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((profile) => (
            <RegistryEntryCard key={profile.contractId} profile={profile} />
          ))}
        </div>
      )}
    </>
  );
}
