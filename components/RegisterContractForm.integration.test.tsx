// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const flow = vi.hoisted(() => ({
  driver: {
    prepare: vi.fn(),
    send: vi.fn(),
    status: vi.fn(),
  },
  kit: {
    init: vi.fn(),
    authModal: vi.fn(),
    getAddress: vi.fn(),
    signTransaction: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('@/lib/sorobanTx', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/sorobanTx')>();
  return {
    ...actual,
    createStellarDriver: vi.fn(() => flow.driver),
  };
});

vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: flow.kit,
  Networks: {
    PUBLIC: 'Public Global Stellar Network ; September 2015',
    TESTNET: 'Test SDF Network ; September 2015',
  },
}));
vi.mock('@creit.tech/stellar-wallets-kit/modules/albedo', () => ({ AlbedoModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/freighter', () => ({ FreighterModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/lobstr', () => ({ LobstrModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/rabet', () => ({ RabetModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/xbull', () => ({ xBullModule: class {} }));

import RegisterContractForm from './RegisterContractForm';

const OWNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const TARGET = 'CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/contract id/i), { target: { value: TARGET } });
  fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: 'My Protocol' } });
  fireEvent.click(screen.getByRole('button', { name: 'DeFi', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: /register contract/i }));
}

function renderFlow() {
  return render(
    <RegisterContractForm
      walletAddress={OWNER}
      transactionWait={async () => {}}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  flow.driver.prepare.mockResolvedValue('PREPARED_XDR');
  flow.driver.send.mockResolvedValue('HASH');
  flow.driver.status.mockResolvedValue('SUCCESS');
  flow.kit.signTransaction.mockResolvedValue({ signedTxXdr: 'SIGNED_XDR' });
});

afterEach(cleanup);

describe('wallet transaction flow integration', () => {
  it('drives approval from the UI through the wallet boundary and every transaction phase', async () => {
    const prepared = deferred<string>();
    const signed = deferred<{ signedTxXdr: string }>();
    const sent = deferred<string>();
    const confirmed = deferred<string>();
    flow.driver.prepare.mockReturnValue(prepared.promise);
    flow.kit.signTransaction.mockReturnValue(signed.promise);
    flow.driver.send.mockReturnValue(sent.promise);
    flow.driver.status.mockReturnValue(confirmed.promise);

    renderFlow();
    fillAndSubmit();
    expect((await screen.findByRole('button', { name: /preparing transaction/i })).hasAttribute('disabled')).toBe(true);

    await act(async () => prepared.resolve('PREPARED_XDR'));
    expect((await screen.findByRole('button', { name: /approve in your wallet/i })).hasAttribute('disabled')).toBe(true);
    expect(flow.kit.signTransaction).toHaveBeenCalledWith('PREPARED_XDR', {
      networkPassphrase: expect.any(String),
      address: OWNER,
    });

    await act(async () => signed.resolve({ signedTxXdr: 'SIGNED_XDR' }));
    expect((await screen.findByRole('button', { name: /submitting/i })).hasAttribute('disabled')).toBe(true);
    expect(flow.driver.send).toHaveBeenCalledWith('SIGNED_XDR');

    await act(async () => sent.resolve('HASH'));
    expect((await screen.findByRole('button', { name: /confirming/i })).hasAttribute('disabled')).toBe(true);

    await act(async () => confirmed.resolve('SUCCESS'));
    expect((await screen.findByRole('status')).textContent).toMatch(/my protocol registered/i);
    expect((screen.getByLabelText(/contract id/i) as HTMLInputElement).value).toBe('');
  });

  it('shows a preparation failure after the building state', async () => {
    const prepared = deferred<string>();
    flow.driver.prepare.mockReturnValue(prepared.promise);
    renderFlow();
    fillAndSubmit();

    expect((await screen.findByRole('button', { name: /preparing transaction/i })).hasAttribute('disabled')).toBe(true);
    await act(async () => prepared.reject(new Error('Simulation failed. Check the contract ID.')));

    expect((await screen.findByRole('alert')).textContent).toContain('Simulation failed. Check the contract ID.');
    expect(flow.kit.signTransaction).not.toHaveBeenCalled();
  });

  it('shows a wallet rejection after requesting approval', async () => {
    const signed = deferred<{ signedTxXdr: string }>();
    flow.kit.signTransaction.mockReturnValue(signed.promise);
    renderFlow();
    fillAndSubmit();

    expect((await screen.findByRole('button', { name: /approve in your wallet/i })).hasAttribute('disabled')).toBe(true);
    await act(async () => signed.reject(new Error('User rejected the request.')));

    expect((await screen.findByRole('alert')).textContent).toContain('User rejected the request.');
    expect(flow.driver.send).not.toHaveBeenCalled();
  });

  it('shows a submission failure after the wallet approves', async () => {
    const sent = deferred<string>();
    flow.driver.send.mockReturnValue(sent.promise);
    renderFlow();
    fillAndSubmit();

    expect((await screen.findByRole('button', { name: /submitting/i })).hasAttribute('disabled')).toBe(true);
    await act(async () => sent.reject(new Error('The network rejected the transaction.')));

    expect((await screen.findByRole('alert')).textContent).toContain('The network rejected the transaction.');
    expect(flow.driver.status).not.toHaveBeenCalled();
  });

  it('shows a confirmation failure after submission', async () => {
    const confirmed = deferred<string>();
    flow.driver.status.mockReturnValue(confirmed.promise);
    renderFlow();
    fillAndSubmit();

    expect((await screen.findByRole('button', { name: /confirming/i })).hasAttribute('disabled')).toBe(true);
    await act(async () => confirmed.resolve('FAILED'));

    expect((await screen.findByRole('alert')).textContent).toMatch(/status: FAILED/i);
  });
});
