'use client';

import { useCallback, useEffect, useState } from 'react';

export type TimezoneOption = 'system' | 'UTC';

const STORAGE_KEY = 'lumina-timezone';

export function useTimezone(): { timezone: TimezoneOption; setTimezone: (tz: TimezoneOption) => void } {
  const [timezone, setTimezoneState] = useState<TimezoneOption>('system');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as TimezoneOption | null;
    const resolved: TimezoneOption = stored === 'UTC' ? 'UTC' : 'system';
    setTimezoneState(resolved);
  }, []);

  const setTimezone = useCallback((next: TimezoneOption) => {
    setTimezoneState(next);
    if (next === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { timezone, setTimezone };
}
