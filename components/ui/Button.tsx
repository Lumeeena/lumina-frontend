/**
 * Button — shared button component (#44).
 *
 * Variants:
 *   primary     — filled violet; the main call-to-action.
 *   secondary   — ghost/outline; secondary actions.
 *   destructive — outline that turns red on hover; irreversible actions.
 *   ghost       — text-only; low-emphasis actions (e.g. tab switches).
 *
 * Sizes:
 *   sm — compact controls inside cards.
 *   md — default form buttons.
 *   lg — top-level CTAs.
 *
 * Loading and disabled states are handled once here; callers never need to
 * repeat the opacity / cursor / aria-busy pattern.
 */
import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Text shown while loading (defaults to children). */
  loadingText?: string;
}

const BASE =
  'inline-flex items-center justify-center font-bold rounded-lg transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white',
  secondary:
    'bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] ' +
    'text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] ' +
    'hover:text-[var(--color-accent-text)]',
  destructive:
    'border border-[var(--color-border-default)] text-[var(--color-text-secondary)] ' +
    'hover:border-[var(--color-error-text)] hover:text-[var(--color-error-text)]',
  ghost:
    'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] ' +
    'hover:bg-[var(--color-bg-raised)]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-2',
  md: 'text-sm py-3 px-4',
  lg: 'text-sm py-3 px-5',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      disabled,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...rest}
      >
        {loading ? (loadingText ?? children) : children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
