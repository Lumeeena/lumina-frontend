'use client';

import { useTimezone, type TimezoneOption } from '@/lib/useTimezone';
import { t } from '@/lib/i18n';

const LABELS: Record<TimezoneOption, string> = {
  system: 'timezone.system',
  UTC: 'timezone.utc',
};

const NEXT: Record<TimezoneOption, TimezoneOption> = {
  system: 'UTC',
  UTC: 'system',
};

export default function TimezoneToggle() {
  const { timezone, setTimezone } = useTimezone();

  return (
    <button
      type="button"
      onClick={() => setTimezone(NEXT[timezone])}
      aria-label={`Current: ${t(LABELS[timezone])}. Click to switch.`}
      title={t(LABELS[timezone])}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-base
                 text-[--color-text-secondary] hover:text-[--color-text-primary]
                 hover:bg-[--color-bg-raised] transition-colors"
    >
      {timezone === 'UTC' ? '🌍' : '📍'}
    </button>
  );
}
