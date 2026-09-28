/** Reserve the same result header and seven-column table shown after search. */
export default function SearchLoading() {
  return (
    <div role="status" aria-label="Searching transactions" className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12 animate-pulse">
      <span className="sr-only">Searching transactions</span>
      <div aria-hidden="true" className="h-9 w-44 rounded bg-[var(--color-bg-overlay)] mb-3" />
      <div aria-hidden="true" className="h-5 w-80 max-w-full rounded bg-[var(--color-bg-overlay)] mb-7" />
      <div aria-hidden="true" className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
        <div className="h-10 border-b border-[var(--color-border-default)] bg-[var(--color-bg-raised)]" />
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-[45px] border-b border-[var(--color-border-default)] last:border-0 bg-white" />
        ))}
      </div>
    </div>
  );
}
