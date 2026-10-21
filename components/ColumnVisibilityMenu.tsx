"use client";

import { useState, useRef, useEffect } from "react";

export interface ColumnVisibilityMenuProps {
  /** Column definitions with key and label */
  columns: Array<{ key: string; label: string }>;
  /** Check if a column is visible */
  isVisible: (key: string) => boolean;
  /** Toggle a column's visibility */
  toggleColumn: (key: string) => void;
  /** Number of currently visible columns */
  visibleCount: number;
}

/**
 * Dropdown menu for toggling table column visibility.
 *
 * Displays a list of columns with checkboxes. Prevents unchecking
 * the last visible column to ensure at least one column remains.
 *
 * @example
 * ```tsx
 * const { isVisible, toggleColumn, visibleCount } = useColumnVisibility(...);
 *
 * <ColumnVisibilityMenu
 *   columns={[
 *     { key: 'date', label: 'Date' },
 *     { key: 'amount', label: 'Amount' },
 *   ]}
 *   isVisible={isVisible}
 *   toggleColumn={toggleColumn}
 *   visibleCount={visibleCount}
 * />
 * ```
 */
export function ColumnVisibilityMenu({
  columns,
  isVisible,
  toggleColumn,
  visibleCount,
}: ColumnVisibilityMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-default)] hover:bg-[var(--color-bg-subtle)] transition-colors flex items-center gap-2"
        aria-label="Toggle column visibility"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2z" />
        </svg>
        Columns
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-default)] shadow-lg z-50 py-1"
        >
          <div className="px-3 py-2 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border-default)]">
            Show columns ({visibleCount}/{columns.length})
          </div>

          <div className="py-1">
            {columns.map((column) => {
              const visible = isVisible(column.key);
              const isLastVisible = visible && visibleCount === 1;

              return (
                <label
                  key={column.key}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-bg-subtle)] transition-colors ${
                    isLastVisible ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title={isLastVisible ? "At least one column must be visible" : ""}
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumn(column.key)}
                    disabled={isLastVisible}
                    className="rounded border-[var(--color-border-default)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0"
                    role="menuitemcheckbox"
                    aria-checked={visible}
                  />
                  <span>{column.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
