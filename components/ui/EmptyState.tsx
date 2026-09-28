/**
 * EmptyState — shared component for lists, sections and pages with nothing to
 * show yet (#47).
 *
 * Use cases:
 *   • `variant="section"` (default) — a bordered box inside a page section.
 *     Dashed border signals "nothing here yet" without implying an error.
 *   • `variant="inline"` — a plain paragraph for tight spaces (inside a table
 *     cell or a small panel).
 *   • `variant="page"` — a centred full-page layout for route-level emptiness
 *     (e.g. search with no results, a 404-style "nothing indexed yet").
 *
 * Every variant accepts an optional `action` — a button or link the user can
 * take next. Acceptance criteria require each state to suggest a next action.
 *
 * Accessibility
 * -------------
 * The container carries no ARIA role by default; it is plain presentational
 * content. If the empty state replaces a `role="status"` or `role="alert"`
 * region, pass `role` explicitly via `containerProps`.
 */

import type { ReactNode } from "react";

export type EmptyStateVariant = "section" | "inline" | "page";

export interface EmptyStateProps {
  /** Primary message: what is missing. Keep it short. */
  title: string;
  /**
   * Supporting copy: why it is missing and/or what to do next.
   * Required for "section" and "page" variants; omit for "inline".
   */
  description?: string;
  /**
   * A call-to-action element — typically a `<Button>` or an `<a>`.
   * Rendered below the description.
   */
  action?: ReactNode;
  /** Visual treatment. Defaults to "section". */
  variant?: EmptyStateVariant;
  /** Extra class names forwarded to the outermost element. */
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  variant = "section",
  className = "",
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <p className={`text-sm text-[var(--color-text-muted)] ${className}`}>
        {title}
        {action && <span className="ml-2">{action}</span>}
      </p>
    );
  }

  if (variant === "page") {
    return (
      <div
        className={`max-w-lg mx-auto px-6 py-24 text-center ${className}`}
      >
        <p className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
          {title}
        </p>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
            {description}
          </p>
        )}
        {action}
      </div>
    );
  }

  // variant === "section" (default)
  return (
    <div
      className={`rounded-xl border border-dashed border-[var(--color-border-default)] p-8 text-center ${className}`}
    >
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)] max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
