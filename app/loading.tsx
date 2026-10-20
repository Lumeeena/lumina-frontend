const SKELETON_BG = 'bg-[var(--color-skeleton-bg)] rounded animate-pulse';

/** Home loading state reserves the hero, ledger cards and feed columns. */
export default function HomeLoading() {
  return (
    <div role="status" aria-label="Loading home page" className="animate-pulse">
      <span className="sr-only">Loading home page</span>
      <section aria-hidden="true" className="px-4 sm:px-7 pt-14 sm:pt-20 pb-10 sm:pb-14 border-b border-[var(--color-border-default)]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-14 items-start">
          <div className="flex flex-col gap-4">
            <div className={`h-6 w-36 rounded-full ${SKELETON_BG}`} />
            <div className={`h-28 max-w-[520px] rounded-xl ${SKELETON_BG}`} />
            <div className={`h-5 w-[min(34rem,100%)] rounded-xl ${SKELETON_BG}`} />
            <div className={`h-5 w-60 rounded-xl ${SKELETON_BG}`} />
            <div className="flex gap-2">
              <div className={`h-12 w-40 rounded-lg ${SKELETON_BG}`} />
              <div className={`h-12 w-48 rounded-lg ${SKELETON_BG}`} />
            </div>
          </div>
          <div className={`h-[150px] rounded-2xl border border-[var(--color-border-default)] ${SKELETON_BG}`} />
        </div>
      </section>
      <section aria-hidden="true" className="px-4 sm:px-7 py-8 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="border border-[var(--color-border-default)] rounded-xl p-5 flex flex-col gap-2.5">
              <div className={`h-2.5 w-20 ${SKELETON_BG}`} />
              <div className={`h-6 w-28 ${SKELETON_BG}`} />
              <div className={`h-2.5 w-16 ${SKELETON_BG}`} />
            </div>
          ))}
        </div>
      </section>
      <section aria-hidden="true" className="px-4 sm:px-7 py-10 sm:py-12">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-7 items-start">
          <div>
            <div className={`h-5 w-40 mb-4 rounded ${SKELETON_BG}`} />
            <div className={`h-[360px] rounded-xl border border-[var(--color-border-default)] ${SKELETON_BG}`} />
          </div>
          <div className="flex flex-col gap-2.5">
            <div className={`h-5 w-32 mb-3 rounded ${SKELETON_BG}`} />
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="border border-[var(--color-border-default)] rounded-xl p-4 flex flex-col gap-2">
                <div className={`h-3 w-32 ${SKELETON_BG}`} />
                <div className={`h-3 w-24 ${SKELETON_BG}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
