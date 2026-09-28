/**
 * InlineLoading — shared component for component-level (non-route-skeleton)
 * loading states (#47).
 *
 * Route-level loading uses `RouteSkeleton` via `loading.tsx`. This covers the
 * cases that are too small or too dynamic to warrant a full skeleton:
 *
 *   • `variant="text"` (default) — a pulsing muted line, for a paragraph or
 *     small panel that is waiting for its data ("Loading your contracts…").
 *   • `variant="spinner"` — an animated ring + label, for a boxed area that
 *     has a defined minimum height (e.g. a chart slot while its data loads).
 *
 * Accessibility
 * -------------
 * The container carries `role="status"` so screen readers announce the label
 * without interrupting the user. The visual animation is `aria-hidden`; the
 * label is visually present in "text" variant or sr-only in "spinner".
 */

export type InlineLoadingVariant = "text" | "spinner";

export interface InlineLoadingProps {
  /** What is loading, e.g. "Loading your contracts". */
  label: string;
  /** Visual treatment. Defaults to "text". */
  variant?: InlineLoadingVariant;
  /** Extra class names forwarded to the outermost element. */
  className?: string;
  /**
   * Minimum height for the spinner variant. Useful when the loader stands in
   * for a fixed-height element so the layout does not collapse.
   */
  minHeight?: number;
}

export function InlineLoading({
  label,
  variant = "text",
  className = "",
  minHeight,
}: InlineLoadingProps) {
  if (variant === "spinner") {
    return (
      <div
        role="status"
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-8 ${className}`}
        style={minHeight !== undefined ? { minHeight } : undefined}
      >
        {/* Animated ring — purely decorative */}
        <span
          aria-hidden="true"
          className="block w-6 h-6 rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-fill)] animate-spin"
        />
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className="text-[13px] text-[var(--color-text-muted)]"
        >
          {label}&hellip;
        </span>
      </div>
    );
  }

  // variant === "text" (default)
  return (
    <p
      role="status"
      className={`text-sm text-[var(--color-text-muted)] animate-pulse ${className}`}
    >
      {label}&hellip;
    </p>
  );
}
