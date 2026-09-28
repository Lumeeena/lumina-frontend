import * as React from 'react';

export const fieldLabelClass =
  'block text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-1.5';

export const fieldInputClassName =
  'w-full min-h-[38px] px-3 py-2 text-[13px] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[9px] ' +
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors ' +
  'focus-visible:outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-fill)]/20';

export const fieldErrorClass = 'mt-1.5 text-[11px] text-[var(--color-error-text)]';

export interface FieldProps {
  id: string;
  label: React.ReactNode;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  id,
  label,
  error,
  helpText,
  className,
  children,
}: FieldProps) {
  const describedBy = [
    helpText ? `${id}-help` : undefined,
    error ? `${id}-error` : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      {helpText ? (
        <p id={`${id}-help`} className="mb-1.5 text-[11px] text-[var(--color-text-muted)]">
          {helpText}
        </p>
      ) : null}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
          })
        : children}
      {error ? (
        <p id={`${id}-error`} role="alert" className={fieldErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: React.ReactNode;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  inputClassName?: string;
}

export function TextField({
  id,
  label,
  error,
  helpText,
  inputClassName = '',
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field id={id} label={label} error={error} helpText={helpText} className={className}>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [helpText ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={`${fieldInputClassName} ${inputClassName}`.trim()}
      />
    </Field>
  );
}

export interface TextareaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: React.ReactNode;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  inputClassName?: string;
}

export function TextareaField({
  id,
  label,
  error,
  helpText,
  inputClassName = '',
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <Field id={id} label={label} error={error} helpText={helpText} className={className}>
      <textarea
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [helpText ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={`${fieldInputClassName} ${inputClassName}`.trim()}
      />
    </Field>
  );
}

export interface FieldsetProps {
  legend: React.ReactNode;
  helpText?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Fieldset({ legend, helpText, error, className, children }: FieldsetProps) {
  return (
    <fieldset className={className}>
      <legend className={fieldLabelClass}>{legend}</legend>
      {helpText ? <p className="mb-1.5 text-[11px] text-[var(--color-text-muted)]">{helpText}</p> : null}
      {children}
      {error ? <p role="alert" className={fieldErrorClass}>{error}</p> : null}
    </fieldset>
  );
}
