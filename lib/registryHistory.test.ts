import { describe, expect, it } from 'vitest';
import { historyFor, parseRegistryEvents } from './registryHistory';
import type { ContractEvent } from './types';

const SUBJECT = 'CCONTRACTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const OTHER = 'CCONTRACTBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const OWNER = 'GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

function event(overrides: Partial<ContractEvent> = {}): ContractEvent {
  return {
    id: 'ev1',
    type: 'contract',
    contractId: 'CREGISTRY',
    ledger: 100,
    createdAt: '2026-09-01T00:00:00Z',
    pagingToken: '100-1',
    topics: ['contract_registered'],
    value: JSON.stringify({ contract_id: SUBJECT, owner: OWNER, name: 'My Protocol' }),
    ...overrides,
  };
}

describe('parseRegistryEvents', () => {
  it('maps registry topics onto history types', () => {
    const entries = parseRegistryEvents([
      event({ id: 'a', topics: ['contract_registered'] }),
      event({ id: 'b', topics: ['contract_deactivated'], ledger: 101 }),
      event({ id: 'c', topics: ['metadata_updated'], ledger: 102 }),
      event({ id: 'd', topics: ['ownership_transferred'], ledger: 103 }),
    ]);

    expect(entries.map(e => e.type)).toEqual([
      'ownership-transferred',
      'metadata-updated',
      'deactivated',
      'registered',
    ]);
  });

  it('orders newest first by ledger', () => {
    const entries = parseRegistryEvents([
      event({ id: 'old', ledger: 10 }),
      event({ id: 'new', ledger: 30 }),
      event({ id: 'mid', ledger: 20 }),
    ]);

    expect(entries.map(e => e.id)).toEqual(['new', 'mid', 'old']);
  });

  it('extracts the registered contract as the subject, not the emitting registry', () => {
    const [entry] = parseRegistryEvents([event()]);

    expect(entry.subject).toBe(SUBJECT);
    // The event is emitted *by* the registry, which is a different address.
    expect(entry.subject).not.toBe('CREGISTRY');
  });

  it('reads the subject from a tuple payload', () => {
    const [entry] = parseRegistryEvents([
      event({ value: JSON.stringify([SUBJECT, OWNER, 'My Protocol']) }),
    ]);

    expect(entry.subject).toBe(SUBJECT);
  });

  it('tolerates quoted symbol topics', () => {
    // Whether the indexer hands back `contract_registered` or
    // `"contract_registered"` depends on how the ScVal was serialised; a
    // quoting change upstream must not turn every event into `unknown`.
    const [entry] = parseRegistryEvents([event({ topics: ['"contract_registered"'] })]);

    expect(entry.type).toBe('registered');
  });

  it('keeps an unrecognised event rather than dropping it', () => {
    const entries = parseRegistryEvents([event({ topics: ['something_new'] })]);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('unknown');
  });

  it('survives an unparseable value', () => {
    const [entry] = parseRegistryEvents([event({ value: 'not json at all' })]);

    expect(entry.type).toBe('registered');
    expect(entry.subject).toBeNull();
    expect(entry.detail).toEqual({ raw: 'not json at all' });
  });

  it('survives a null value and missing topics', () => {
    const [entry] = parseRegistryEvents([event({ value: null, topics: [] })]);

    expect(entry.type).toBe('unknown');
    expect(entry.subject).toBeNull();
  });
});

describe('historyFor', () => {
  it('returns only the entries about one contract', () => {
    const entries = parseRegistryEvents([
      event({ id: 'a', value: JSON.stringify({ contract_id: SUBJECT }) }),
      event({ id: 'b', value: JSON.stringify({ contract_id: OTHER }), ledger: 101 }),
      event({ id: 'c', value: JSON.stringify({ contract_id: SUBJECT }), ledger: 102 }),
    ]);

    expect(historyFor(entries, SUBJECT).map(e => e.id)).toEqual(['c', 'a']);
  });

  it('returns nothing for a contract with no events', () => {
    const entries = parseRegistryEvents([event()]);
    expect(historyFor(entries, OTHER)).toEqual([]);
  });
});
