/**
 * Tooltip — accessible tooltip primitive (#218).
 *
 * Features:
 *   - Keyboard accessible (shows on focus, hides on blur)
 *   - ARIA describedby association
 *   - Configurable placement (top, bottom, left, right)
 *   - Delay before showing
 *   - Portal-based rendering to avoid overflow clipping
 */
import * as React from 'react';
import { createPortal } from 'react-dom';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Tooltip content. */
  content: React.ReactNode;
  /** The element the tooltip describes. */
  children: React.ReactNode;
  /** Placement relative to the trigger. */
  placement?: TooltipPlacement;
  /** Delay in milliseconds before showing. */
  delay?: number;
  /** Disable the tooltip entirely. */
  disabled?: boolean;
  /** Additional class names for the tooltip bubble. */
  className?: string;
}

const PLACEMENT_STYLES: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const ARROW_STYLES: Record<TooltipPlacement, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--color-bg-elevated)]',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--color-bg-elevated)]',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--color-bg-elevated)]',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--color-bg-elevated)]',
};

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, placement = 'top', delay = 200, disabled = false, className = '' }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const tooltipId = React.useId();

    const showTooltip = React.useCallback(() => {
      if (disabled) return;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
          setPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX + rect.width / 2,
          });
        }
        setVisible(true);
      }, delay);
    }, [delay, disabled]);

    const hideTooltip = React.useCallback(() => {
      clearTimeout(timeoutRef.current);
      setVisible(false);
    }, []);

    React.useEffect(() => {
      return () => clearTimeout(timeoutRef.current);
    }, []);

    return (
      <>
        <div
          ref={triggerRef}
          className={`inline-block ${className}`}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          aria-describedby={visible ? tooltipId : undefined}
        >
          {children}
        </div>
        {visible &&
          position &&
          createPortal(
            <div
              ref={ref}
              id={tooltipId}
              role="tooltip"
              className={`fixed z-50 pointer-events-none ${PLACEMENT_STYLES[placement]}`}
              style={{ top: position.top, left: position.left }}
            >
              <div className="relative bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-[var(--color-border-default)] whitespace-nowrap">
                {content}
                <div
                  className={`absolute w-0 h-0 border-4 border-transparent ${ARROW_STYLES[placement]}`}
                />
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';
