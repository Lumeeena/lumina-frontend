/**
 * InlineError — shared component for component-level (non-route-boundary)
 * error states (#47).
 *
 * Use cases:
 *   • `variant="card"` (default) — a bordered card, suitable for replacing a
 *     section that failed to load (e.g. a chart, a list, a panel).
 *   • `variant="banner"` — a compact coloured pill/bar, suitable for an error
 *     that sits alongside other content (e.g. inside a toolbar or a footer).
 *   • `variant="text"` — a bare coloured paragraph with role="alert", for
 *     very tight spaces (e.g. an error line under a field or inside a list row).
 *
 * All variants:
 *   • carry `role="alert"` so screen readers announce the message immediately.
 *   • accept an optional `onRetry` callback that renders a "Try again" button.
 *   • use design-system tokens exclusively — no hardcoded colours.
 *
 * The wording follows the convention established by BackendUnavailable and
 * RouteError: say what went wrong briefly, then offer a concrete next step.
 */

import { Button } from "@/components/ui/Button";

export type InlineErrorVariant = "card" | "banner" | "text";

export interface InlineErrorProps {
  /** Short description of what failed. */
  message: string;
  /** Called when the user clicks "Try again". Omit to hide the button. */
  onRetry?: () => void;
  /** Visual treatment. Defaults to "card". */
  variant?: InlineErrorVariant;
  /** Extra class names forwarded to the outermost element. */
  className?: string;
  /**
   * Minimum height for the card variant, forwarded as an inline style.
   * Useful when the error card stands in for a fixed-height element (e.g.
   * a chart) so the layout does not collapse.
   */
  minHeight?: number;
}

export function InlineError({
  message,
  onRetry,
  variant = "card",
  className = "",
  minHeight,
}: InlineErrorProps) {
  if (variant === "text") {
    return (
      <p
        role="alert"
        className={`text-sm text-[var(--color-error-text)] ${className}`}
      >
        {message}
        {onRetry && (
          <>
            {" "}
            <button
              type="button"
              onClick={onRetry}
              className="underline underline-offset-2 font-semibold hover:no-underline"
            >
              Try again.
            </button>
          </>
        )}
      </p>
    );
  }

  if (variant === "banner") {
    return (
      <div
        role="alert"
        className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error-text)] text-sm ${className}`}
      >
        <span className="flex-1">{message}</span>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  // variant === "card" (default)
  return (
    <div
      role="alert"
      className={`rounded-xl border border-[var(--color-error-outline)] bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center gap-3 p-8 text-center ${className}`}
      style={minHeight !== undefined ? { minHeight } : undefined}
    >
      <p className="text-[var(--color-error-text)] text-sm font-semibold">
        Something went wrong
      </p>
      <p className="text-[var(--color-text-muted)] text-xs max-w-xs">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
