/** Match the registry form and entry list while client data hydrates. */
export default function RegistryLoading() {
  return (
    <div role="status" aria-label="Loading registry" className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <span className="sr-only">Loading registry</span>
      <div aria-hidden="true" className="h-9 w-64 rounded bg-[var(--color-bg-overlay)] animate-pulse mb-3" />
      <div aria-hidden="true" className="h-5 max-w-[70ch] rounded bg-[var(--color-bg-overlay)] animate-pulse mb-8" />
      <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start animate-pulse">
        <div className="h-[310px] rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]" />
        <div className="flex flex-col gap-3">
          <div className="h-8 w-56 rounded bg-[var(--color-bg-overlay)]" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[92px] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
