/**
 * Wallet-flow tests.
 *
 * `lib/wallet.ts` is the one module that genuinely cannot run outside a
 * browser: it pulls in five wallet modules, several of which are CommonJS
 * bundles that assume `window`. Mocking the kit at the module boundary is what
 * makes the connect flow testable at all — and connect is the step no other
 * test reaches, since the transaction pipeline starts from an address that is
 * already in hand.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const kit = vi.hoisted(() => ({
  init: vi.fn(),
  authModal: vi.fn(),
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: kit,
  Networks: { PUBLIC: 'Public Global Stellar Network ; September 2015', TESTNET: 'Test SDF Network ; September 2015' },
}));

// The individual wallet modules only need to be constructible. Written out one
// by one because `vi.mock` is hoisted above everything else in the file — a
// loop variable does not exist yet at the point these run.
vi.mock('@creit.tech/stellar-wallets-kit/modules/albedo', () => ({ AlbedoModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/freighter', () => ({ FreighterModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/lobstr', () => ({ LobstrModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/rabet', () => ({ RabetModule: class {} }));
vi.mock('@creit.tech/stellar-wallets-kit/modules/xbull', () => ({ xBullModule: class {} }));

const ADDRESS = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS';

let wallet: typeof import('./wallet');

beforeEach(async () => {
  vi.clearAllMocks();
  // Re-imported per test because the module memoises its one-time init.
  vi.resetModules();
  wallet = await import('./wallet');
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('connectWallet', () => {
  it('returns the address the user picked', async () => {
    kit.authModal.mockResolvedValue({ address: ADDRESS });

    await expect(wallet.connectWallet()).resolves.toEqual({ address: ADDRESS });
  });

  it('returns an error instead of throwing when the user dismisses the modal', async () => {
    // Cancelling a wallet picker is a normal thing to do, not an exception the
    // page should have to catch.
    kit.authModal.mockRejectedValue(new Error('Modal closed'));

    await expect(wallet.connectWallet()).resolves.toEqual({ error: 'Modal closed' });
  });

  it('supplies a readable message when the wallet rejects without one', async () => {
    kit.authModal.mockRejectedValue({});

    const result = await wallet.connectWallet();
    expect(result).toEqual({ error: 'Wallet connection was cancelled.' });
  });

  it('initialises the kit exactly once across repeated calls', async () => {
    kit.authModal.mockResolvedValue({ address: ADDRESS });

    await wallet.connectWallet();
    await wallet.connectWallet();
    await wallet.getConnectedAddress();

    expect(kit.init).toHaveBeenCalledTimes(1);
  });

  it('registers all five wallet modules', async () => {
    kit.authModal.mockResolvedValue({ address: ADDRESS });
    await wallet.connectWallet();

    const { modules } = kit.init.mock.calls[0][0];
    expect(modules).toHaveLength(5);
  });
});

describe('getConnectedAddress', () => {
  it('returns an already-connected address without opening the modal', async () => {
    kit.getAddress.mockResolvedValue({ address: ADDRESS });

    await expect(wallet.getConnectedAddress()).resolves.toBe(ADDRESS);
    expect(kit.authModal).not.toHaveBeenCalled();
  });

  it('returns null when no wallet is connected', async () => {
    kit.getAddress.mockResolvedValue({ address: '' });

    await expect(wallet.getConnectedAddress()).resolves.toBeNull();
  });

  it('returns null rather than throwing when the kit has no session', async () => {
    // This runs on every page load, so it must never surface as an error.
    kit.getAddress.mockRejectedValue(new Error('No wallet selected'));

    await expect(wallet.getConnectedAddress()).resolves.toBeNull();
  });
});

describe('signWithWallet', () => {
  it('passes the XDR and network through to the kit', async () => {
    kit.signTransaction.mockResolvedValue({ signedTxXdr: 'SIGNED' });

    const result = await wallet.signWithWallet('UNSIGNED', {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address: ADDRESS,
    });

    expect(result).toEqual({ signedTxXdr: 'SIGNED' });
    expect(kit.signTransaction).toHaveBeenCalledWith('UNSIGNED', {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address: ADDRESS,
    });
  });

  it('propagates a declined signature so the caller can report it', async () => {
    // Unlike connect, a refused signature must reach the transaction pipeline,
    // which tags it with the phase it happened in.
    kit.signTransaction.mockRejectedValue(new Error('User declined access'));

    await expect(
      wallet.signWithWallet('UNSIGNED', {
        networkPassphrase: 'Test SDF Network ; September 2015',
        address: ADDRESS,
      })
    ).rejects.toThrow('User declined access');
  });
});

describe('disconnectWallet', () => {
  it('disconnects through the kit', async () => {
    kit.disconnect.mockResolvedValue(undefined);

    await wallet.disconnectWallet();

    expect(kit.disconnect).toHaveBeenCalled();
  });
});
