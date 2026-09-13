import { describe, expect, it, vi } from 'vitest';
import {
  ContractCallError,
  submitContractCall,
  type ContractCallDriver,
  type TxPhase,
} from './sorobanTx';

const CALL = { contractId: 'CREGISTRY', method: 'deactivate', args: [] };
const WALLET = 'GOWNER';
const PASSPHRASE = 'Test SDF Network ; September 2015';

/** A driver whose every step can be made to succeed, fail, or stall. */
function driver(overrides: Partial<ContractCallDriver> = {}): ContractCallDriver {
  return {
    prepare: vi.fn(async () => 'PREPARED_XDR'),
    send: vi.fn(async () => 'HASH'),
    status: vi.fn(async () => 'SUCCESS'),
    ...overrides,
  };
}

const signOk = vi.fn(async () => ({ signedTxXdr: 'SIGNED_XDR' }));

function submit(d: ContractCallDriver, opts: Partial<Parameters<typeof submitContractCall>[0]> = {}) {
  return submitContractCall({
    driver: d,
    call: CALL,
    sign: signOk,
    walletAddress: WALLET,
    networkPassphrase: PASSPHRASE,
    // No real waiting — every test here would otherwise cost seconds.
    wait: async () => {},
    ...opts,
  });
}

describe('submitContractCall', () => {
  it('runs the full pipeline and reports the transaction hash', async () => {
    const d = driver();
    const result = await submit(d);

    expect(result.hash).toBe('HASH');
    expect(d.prepare).toHaveBeenCalledWith(CALL);
    expect(d.send).toHaveBeenCalledWith('SIGNED_XDR');
  });

  it('signs the prepared XDR, not the raw call', async () => {
    const sign = vi.fn(async () => ({ signedTxXdr: 'SIGNED_XDR' }));
    await submit(driver(), { sign });

    expect(sign).toHaveBeenCalledWith('PREPARED_XDR', {
      networkPassphrase: PASSPHRASE,
      address: WALLET,
    });
  });

  it('reports phases in order', async () => {
    const phases: TxPhase[] = [];
    await submit(driver(), { onPhase: p => phases.push(p) });

    expect(phases).toEqual(['building', 'awaiting-signature', 'submitting', 'confirming', 'success']);
  });

  it('stops at the failing phase and tags the error with it', async () => {
    const phases: TxPhase[] = [];
    const d = driver({
      prepare: vi.fn(async () => {
        throw new Error('simulation failed: contract not found');
      }),
    });

    await expect(submit(d, { onPhase: p => phases.push(p) })).rejects.toThrow(ContractCallError);
    await expect(submit(d)).rejects.toMatchObject({
      phase: 'building',
      message: 'simulation failed: contract not found',
    });
    // Never reached signing.
    expect(phases).toEqual(['building']);
  });

  it('treats a declined signature as its own phase, not a generic failure', async () => {
    const d = driver();
    const sign = vi.fn(async () => {
      throw new Error('User declined access');
    });

    await expect(submit(d, { sign })).rejects.toMatchObject({ phase: 'awaiting-signature' });
    expect(d.send).not.toHaveBeenCalled();
  });

  it('gives a declined signature a readable message when the wallet supplies none', async () => {
    const sign = vi.fn(async () => {
      throw new Error('');
    });

    await expect(submit(driver(), { sign })).rejects.toThrow('Signature was declined in your wallet.');
  });

  it('surfaces a rejected submission', async () => {
    const d = driver({
      send: vi.fn(async () => {
        throw new Error('The network rejected the transaction.');
      }),
    });

    await expect(submit(d)).rejects.toMatchObject({ phase: 'submitting' });
    expect(d.status).not.toHaveBeenCalled();
  });

  it('polls until the transaction leaves PENDING', async () => {
    const status = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('PENDING')
      .mockResolvedValueOnce('PENDING')
      .mockResolvedValue('SUCCESS');

    const result = await submit(driver({ status }));

    expect(result.hash).toBe('HASH');
    expect(status).toHaveBeenCalledTimes(3);
  });

  it('keeps polling through a transient status error rather than failing the submission', async () => {
    const status = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('RPC unavailable'))
      .mockResolvedValue('SUCCESS');

    await expect(submit(driver({ status }))).resolves.toMatchObject({ hash: 'HASH' });
    expect(status).toHaveBeenCalledTimes(2);
  });

  it('fails rather than claiming success when the transaction never confirms', async () => {
    const status = vi.fn(async () => 'PENDING');

    // The important part is that it does NOT resolve: reporting a contract as
    // deactivated when it might not be is worse than telling the user to wait.
    await expect(submit(driver({ status }), { maxPolls: 3 })).rejects.toThrow(
      /has not confirmed yet/
    );
    expect(status).toHaveBeenCalledTimes(3);
  });

  it('reports a definitively failed transaction with its status', async () => {
    const status = vi.fn(async () => 'FAILED');

    await expect(submit(driver({ status }))).rejects.toThrow(/status: FAILED/);
    // Left the loop as soon as the status was terminal.
    expect(status).toHaveBeenCalledTimes(1);
  });

  it('waits between polls using the injected clock', async () => {
    const wait = vi.fn(async () => {});
    await submit(driver(), { wait, pollIntervalMs: 1234 });

    expect(wait).toHaveBeenCalledWith(1234);
  });
});
