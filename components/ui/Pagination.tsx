/**
 * Pagination — shared pagination component (#217).
 *
 * Features:
 *   - Page numbers with ellipsis truncation
 *   - Previous/Next buttons
 *   - Configurable page size
 *   - Keyboard accessible
 *   - Responsive design
 */
import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  /** Current page (1-indexed). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Callback when page changes. */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show around current page. */
  siblingsCount?: number;
  /** Show first/last page buttons. */
  showFirstLast?: boolean;
  /** Additional class names. */
  className?: string;
}

function getPageRange(currentPage: number, totalPages: number, siblingsCount: number): (number | '...')[] {
  const totalButtons = siblingsCount * 2 + 5; // first + last + current + siblings + 2 ellipsis
  if (totalPages <= totalButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const leftSibling = Math.max(2, currentPage - siblingsCount);
  const rightSibling = Math.min(totalPages - 1, currentPage + siblingsCount);

  pages.push(1);
  if (leftSibling > 2) pages.push('...');
  for (let i = leftSibling; i <= rightSibling; i++) {
    pages.push(i);
  }
  if (rightSibling < totalPages - 1) pages.push('...');
  pages.push(totalPages);

  return pages;
}

export const Pagination = React.forwardRef<HTMLNavElement, PaginationProps>(
  ({ currentPage, totalPages, onPageChange, siblingsCount = 1, showFirstLast = true, className = '' }, ref) => {
    const pages = getPageRange(currentPage, totalPages, siblingsCount);

    return (
      <nav ref={ref} role="navigation" aria-label="Pagination" className={`flex items-center justify-center gap-1 ${className}`}>
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="First page"
          >
            «
          </button>
        )}

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-[var(--color-text-tertiary)]">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={page === currentPage}
              className={`min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-[var(--color-accent-fill)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-raised)]'
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>

        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Last page"
          >
            »
          </button>
        )}
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';
