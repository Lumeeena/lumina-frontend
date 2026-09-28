/** Home loading state reserves the hero, ledger cards and feed columns. */
export default function HomeLoading() {
  return (
    <div role="status" aria-label="Loading the latest ledger" className="animate-pulse">
      <span className="sr-only">Loading the latest ledger</span>
      <section aria-hidden="true" className="px-4 sm:px-7 pt-14 sm:pt-20 pb-10 sm:pb-14 border-b border-[var(--color-border-default)]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-14 items-start">
          <div className="flex flex-col gap-4">
            <div className="h-6 w-36 rounded-full bg-[var(--color-bg-overlay)]" />
            <div className="h-28 max-w-[520px] rounded-xl bg-[var(--color-bg-overlay)]" />
            <div className="h-16 max-w-[540px] rounded-xl bg-[var(--color-bg-overlay)]" />
            <div className="h-12 w-52 rounded-lg bg-[var(--color-bg-overlay)]" />
          </div>
          <div className="h-[150px] rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]" />
        </div>
      </section>
      <section aria-hidden="true" className="px-4 sm:px-7 py-8 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[104px] rounded-xl border border-[var(--color-border-default)] bg-white" />
          ))}
        </div>
      </section>
      <section aria-hidden="true" className="px-4 sm:px-7 py-10 sm:py-12">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-7 items-start">
          <div className="h-[360px] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]" />
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-[66px] rounded-xl border border-[var(--color-border-default)] bg-white" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
