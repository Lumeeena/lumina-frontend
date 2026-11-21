const SKELETON_BG =
  "bg-[var(--color-skeleton-bg)] rounded animate-pulse motion-reduce:animate-none";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading GraphQL playground"
      className="px-4 sm:px-7 py-12"
    >
      <span className="sr-only">Loading GraphQL playground</span>
      <div className="max-w-[1160px] mx-auto mb-8" aria-hidden="true">
        <div className={`h-9 w-48 mb-3 ${SKELETON_BG}`} />
        <div className={`h-5 w-72 ${SKELETON_BG}`} />
      </div>
      <div
        className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4"
        aria-hidden="true"
      >
        <div
          className={`h-96 rounded-xl border border-[var(--color-border-default)] ${SKELETON_BG}`}
        />
        <div
          className={`h-96 rounded-xl border border-[var(--color-border-default)] ${SKELETON_BG}`}
        />
      </div>
    </div>
  );
}
