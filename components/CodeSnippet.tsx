'use client';

import { useRef, useState } from 'react';

export interface CodeSnippetProps {
  code: string;
  language?: 'javascript' | 'typescript' | 'python' | 'curl';
  title?: string;
  copyLabel?: string;
}

export default function CodeSnippet({
  code,
  language = 'javascript',
  title,
  copyLabel = 'Copy',
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] overflow-hidden bg-[var(--color-bg-raised)]">
      {title && (
        <div className="px-4 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {title}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
            {language}
          </span>
        </div>
      )}
      <div className="relative">
        <pre
          ref={codeRef}
          className="bg-[var(--color-inverse-bg)] p-4 overflow-x-auto text-sm leading-relaxed mono text-[var(--color-text-inverse)]"
        >
          <code>{code}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied' : (copyLabel || 'Copy code')}
          className="absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-semibold bg-[var(--color-accent-fill)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-fill-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)] transition-opacity motion-reduce:transition-none"
        >
          {copied ? '✓ Copied' : copyLabel}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? 'Code copied to clipboard' : ''}
        </span>
      </div>
      {copyError && (
        <p role="alert" className="px-4 py-2 text-xs text-[var(--color-error-text)]">
          Clipboard access failed. Select the code and copy it manually.
        </p>
      )}
    </div>
  );
}
