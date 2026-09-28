'use client';

export interface LanguageSelectorProps {
  selected: string;
  onChange: (language: string) => void;
  languages?: Array<{ id: string; label: string }>;
}

export default function LanguageSelector({
  selected,
  onChange,
  languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'curl', label: 'curl' },
  ],
}: LanguageSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {languages.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onChange(lang.id)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            selected === lang.id
              ? 'bg-[var(--color-accent-fill)] text-[var(--color-accent-text)]'
              : 'bg-[var(--color-bg-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
