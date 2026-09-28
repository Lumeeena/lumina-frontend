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
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getBgColor = () => {
    switch (language) {
      case 'python':
        return 'bg-[#2e3440]';
      case 'javascript':
      case 'typescript':
        return 'bg-[#1e1e1e]';
      case 'curl':
        return 'bg-[#2e2e2e]';
      default:
        return 'bg-[var(--color-bg-raised)]';
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
          className={`${getBgColor()} p-4 overflow-x-auto text-sm leading-relaxed mono text-[#e8e8e8]`}
        >
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-semibold bg-[var(--color-accent-fill)] text-[var(--color-accent-text)] hover:opacity-90 transition-opacity"
        >
          {copied ? '✓ Copied' : copyLabel}
        </button>
      </div>
    </div>
  );
}
