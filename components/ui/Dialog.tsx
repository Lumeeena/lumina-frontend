/**
 * Dialog — accessible modal with focus trap (#215).
 *
 * Features:
 *   - Focus trap (Tab cycles within dialog)
 *   - Escape to close
 *   - Click outside to close
 *   - ARIA dialog role and labelledby/describedby
 *   - Portal-based rendering
 *   - Scroll lock when open
 */
import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface DialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback when the dialog should close. */
  onClose: () => void;
  /** Dialog title. */
  title: string;
  /** Dialog description (optional). */
  description?: string;
  /** Dialog content. */
  children: React.ReactNode;
  /** Dialog footer actions. */
  footer?: React.ReactNode;
  /** Additional class names for the dialog panel. */
  className?: string;
  /** Maximum width class. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onClose, title, description, children, footer, className = '', maxWidth = 'md' }, ref) => {
    const panelRef = React.useRef<HTMLDivElement>(null);
    const titleId = React.useId();
    const descId = React.useId();

    // Focus trap
    React.useEffect(() => {
      if (!open) return;

      const panel = panelRef.current;
      if (!panel) return;

      // Focus first focusable element
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();

      // Trap focus
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab') {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      panel.addEventListener('keydown', handleKeyDown);
      return () => panel.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // Scroll lock
    React.useEffect(() => {
      if (!open) return;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className={`bg-[var(--color-bg-primary)] rounded-xl shadow-2xl border border-[var(--color-border-default)] w-full ${MAX_WIDTH_CLASSES[maxWidth]} ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-[var(--color-text-primary)]">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-raised)] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[var(--color-border-default)] flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }
);

Dialog.displayName = 'Dialog';
