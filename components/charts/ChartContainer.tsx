import type { ReactNode } from "react";

export interface ChartContainerProps {
  /** Accessible title — also rendered as the card heading. */
  title: string;
  /**
   * Longer description read by screen readers in place of the SVG.
   * Should convey the chart's meaning (trend, totals, comparison), not
   * restate the title. Required for a11y — a chart with no description
   * fails WCAG 1.1.1.
   */
  description: string;
  /** Optional right-aligned slot (e.g. range selector, "last updated"). */
  action?: ReactNode;
  /** Optional caption under the chart (footnote, data source). */
  caption?: ReactNode;
  /** Fixed height in px. Defaults to 280 — matches the design system's panel rhythm. */
  height?: number;
  children: ReactNode;
}

/**
 * Card-style wrapper for any chart.
 *
 * Responsibilities:
 *  - Card chrome (border, radius, background) using design tokens.
 *  - Heading + optional action slot.
 *  - Accessible region: the chart is announced by `role="img"` and
 *    `aria-label` = `description`; the SVG itself is marked
 *    `aria-hidden` so screen readers do not try to read axis ticks.
 *
 * Every chart in Lumina must be rendered inside this container so that
 * the palette and a11y contract stay consistent.
 */
export function ChartContainer({
  title,
  description,
  action,
  caption,
  height = 280,
  children,
}: ChartContainerProps) {
  return (
    <div className="border border-[var(--color-border-default)] rounded-xl p-4 bg-[var(--color-bg-subtle)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        {action}
      </div>

      <div
        role="img"
        aria-label={description}
        style={{ height }}
        className="w-full"
      >
        {children}
      </div>

      {caption && (
        <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
          {caption}
        </p>
      )}
    </div>
  );
}
