import { useEffect, useState } from "react";

/**
 * Column visibility state management with localStorage persistence.
 *
 * Manages which columns are visible in a table, persisting the choice
 * per table key. Ensures at least one column remains visible.
 *
 * @param tableKey - Unique identifier for the table (used for localStorage key)
 * @param columnKeys - Array of column identifiers
 * @param defaultVisible - Optional array of initially visible columns (defaults to all)
 * @returns Visibility state and toggle function
 *
 * @example
 * ```tsx
 * const columns = ['date', 'type', 'amount', 'status'];
 * const { visibleColumns, toggleColumn, isVisible } = useColumnVisibility(
 *   'transactions-table',
 *   columns
 * );
 *
 * // Render only visible columns
 * {columns.filter(col => isVisible(col)).map(col => <th>{col}</th>)}
 * ```
 */
export function useColumnVisibility(
  tableKey: string,
  columnKeys: string[],
  defaultVisible?: string[]
) {
  const storageKey = `lumina-column-visibility-${tableKey}`;

  // Initialize from localStorage or defaults
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      // SSR: use defaults
      return new Set(defaultVisible ?? columnKeys);
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate stored data
        if (Array.isArray(parsed)) {
          const validColumns = parsed.filter(col => columnKeys.includes(col));
          // Ensure at least one column
          if (validColumns.length > 0) {
            return new Set(validColumns);
          }
        }
      }
    } catch {
      // Invalid stored data, fall through to defaults
    }

    return new Set(defaultVisible ?? columnKeys);
  });

  // Persist to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(visibleColumns))
      );
    } catch {
      // Storage quota exceeded or disabled, continue without persistence
    }
  }, [visibleColumns, storageKey]);

  /**
   * Toggle a column's visibility.
   * Prevents hiding the last visible column.
   */
  const toggleColumn = (columnKey: string) => {
    if (!columnKeys.includes(columnKey)) return;

    setVisibleColumns(prev => {
      const next = new Set(prev);

      if (next.has(columnKey)) {
        // Prevent hiding last column
        if (next.size <= 1) {
          return prev;
        }
        next.delete(columnKey);
      } else {
        next.add(columnKey);
      }

      return next;
    });
  };

  /**
   * Check if a column is visible.
   */
  const isVisible = (columnKey: string): boolean => {
    return visibleColumns.has(columnKey);
  };

  /**
   * Get count of visible columns.
   */
  const visibleCount = visibleColumns.size;

  /**
   * Reset to default visibility.
   */
  const resetToDefaults = () => {
    setVisibleColumns(new Set(defaultVisible ?? columnKeys));
  };

  return {
    visibleColumns: Array.from(visibleColumns),
    toggleColumn,
    isVisible,
    visibleCount,
    resetToDefaults,
  };
}
