/** Loading shape shared by the explorer and transactions routes. */
export default function TransactionExplorerSkeleton() {
  return (
    <div role="status" aria-label="Loading transactions" className="animate-pulse">
      <span className="sr-only">Loading transactions</span>
      <div aria-hidden="true" className="h-[38px] w-full rounded-lg bg-[var(--color-bg-overlay)] mb-4" />
      <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-[62px] rounded-lg bg-[var(--color-bg-overlay)]" />
        ))}
      </div>
      <div aria-hidden="true" className="h-9 w-full rounded-lg bg-[var(--color-bg-overlay)] mb-3" />
      <div aria-hidden="true" className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
        <div className="h-10 border-b border-[var(--color-border-default)] bg-[var(--color-bg-raised)]" />
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-[45px] border-b border-[var(--color-border-default)] last:border-0 bg-white" />
        ))}
      </div>
      <div aria-hidden="true" className="h-10 w-28 mx-auto mt-4 rounded-lg bg-[var(--color-bg-overlay)]" />
    </div>
  );
}
