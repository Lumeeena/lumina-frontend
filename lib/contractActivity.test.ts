import { describe, expect, it, vi } from 'vitest';
import { probeContractActivity } from './contractActivity';
import type { ContractEvent } from './types';

const anEvent = (): ContractEvent => ({
  id: 'ev1',
  type: 'contract',
  contractId: 'C1',
  ledger: 1,
  createdAt: '2026-09-01T00:00:00Z',
  pagingToken: '1-1',
  topics: ['transfer'],
  value: null,
});

describe('probeContractActivity', () => {
  it('marks a contract with events active and one without quiet', async () => {
    const probe = vi.fn(async (id: string) => (id === 'C1' ? [anEvent()] : []));

    const result = await probeContractActivity(['C1', 'C2'], probe);

    expect(result.get('C1')).toBe('active');
    expect(result.get('C2')).toBe('quiet');
  });

  it('reports a failed probe as unknown, never as quiet', async () => {
    // This distinction is the point: showing a healthy contract as "no events"
    // because one request timed out is a worse lie than admitting ignorance.
    const probe = vi.fn(async (id: string) => {
      if (id === 'C2') throw new Error('indexer unreachable');
      return [anEvent()];
    });

    const result = await probeContractActivity(['C1', 'C2'], probe);

    expect(result.get('C1')).toBe('active');
    expect(result.get('C2')).toBe('unknown');
  });

  it('probes each contract once even when given duplicates', async () => {
    const probe = vi.fn(async () => []);

    await probeContractActivity(['C1', 'C1', 'C1'], probe);

    expect(probe).toHaveBeenCalledTimes(1);
  });

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0;
    let peak = 0;
    const probe = vi.fn(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise(r => setTimeout(r, 1));
      inFlight--;
      return [];
    });

    await probeContractActivity(['a', 'b', 'c', 'd', 'e', 'f'], probe, 2);

    expect(probe).toHaveBeenCalledTimes(6);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it('returns an empty map for no contracts without hanging', async () => {
    const probe = vi.fn(async () => []);

    await expect(probeContractActivity([], probe)).resolves.toEqual(new Map());
    expect(probe).not.toHaveBeenCalled();
  });
});
