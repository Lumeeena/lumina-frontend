// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RegistryEntry } from '@/lib/registry';
import { parseRegistryEvents } from '@/lib/registryHistory';
import type { ContractEvent } from '@/lib/types';
import { ContractCallError } from '@/lib/sorobanTx';
import OwnerContracts from './OwnerContracts';

const OWNER = 'GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const C1 = 'CCONTRACTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const C2 = 'CCONTRACTBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

function entry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    contractId: C1,
    owner: OWNER,
    name: 'My Protocol',
    description: 'A DeFi protocol',
    active: true,
    registeredAt: 500,
    ...overrides,
  };
}

function registryEvent(contractId: string, topic: string, ledger: number): ContractEvent {
  return {
    id: `${topic}-${ledger}`,
    type: 'contract',
    contractId: 'CREGISTRY',
    ledger,
    createdAt: new Date().toISOString(),
    pagingToken: `${ledger}-1`,
    topics: [topic],
    value: JSON.stringify({ contract_id: contractId, owner: OWNER }),
  };
}

/** Renders with every dependency stubbed; override only what a test needs. */
function renderDashboard(props: Partial<React.ComponentProps<typeof OwnerContracts>> = {}) {
  return render(
    <OwnerContracts
      walletAddress={OWNER}
      loadContracts={async () => [entry()]}
      loadHistory={async () => []}
      loadActivity={async () => new Map()}
      deactivate={async () => {}}
      {...props}
    />
  );
}

afterEach(cleanup);

describe('OwnerContracts', () => {
  it('shows a loading state before the registry read resolves', async () => {
    let release: (v: RegistryEntry[]) => void = () => {};
    renderDashboard({ loadContracts: () => new Promise<RegistryEntry[]>(r => (release = r)) });

    expect(screen.getByText(/loading your contracts/i)).toBeTruthy();

    release([entry()]);
    await screen.findByText('My Protocol');
  });

  it('queries with the connected wallet and shows only its contracts', async () => {
    const loadContracts = vi.fn(async () => [entry()]);
    renderDashboard({ loadContracts });

    await screen.findByText('My Protocol');
    expect(loadContracts).toHaveBeenCalledWith(OWNER);
  });

  it('shows an empty state when the wallet has registered nothing', async () => {
    renderDashboard({ loadContracts: async () => [] });

    expect(await screen.findByText(/haven't registered any contracts yet/i)).toBeTruthy();
  });

  it('surfaces a registry read failure with a retry that re-reads', async () => {
    const loadContracts = vi
      .fn<() => Promise<RegistryEntry[]>>()
      .mockRejectedValueOnce(new Error('Registry simulation failed'))
      .mockResolvedValue([entry()]);

    renderDashboard({ loadContracts });

    expect(await screen.findByText('Registry simulation failed')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    await screen.findByText('My Protocol');
    expect(loadContracts).toHaveBeenCalledTimes(2);
  });

  it('shows deactivated entries too, not just active ones', async () => {
    // `get_contracts_by_owner` deliberately does not filter on `active` — an
    // owner has to be able to see what they took down.
    renderDashboard({
      loadContracts: async () => [
        entry({ contractId: C1, name: 'Live One' }),
        entry({ contractId: C2, name: 'Retired One', active: false }),
      ],
    });

    await screen.findByText('Live One');
    expect(screen.getByText('Retired One')).toBeTruthy();
    expect(screen.getByText('Deactivated')).toBeTruthy();
  });

  it('offers deactivate only for contracts that are still active', async () => {
    renderDashboard({
      loadContracts: async () => [entry({ contractId: C2, name: 'Retired One', active: false })],
    });

    await screen.findByText('Retired One');
    expect(screen.queryByRole('button', { name: /^deactivate$/i })).toBeNull();
  });

  it('deactivates and reflects the new state without a reload', async () => {
    const deactivate = vi.fn(async () => {});
    const onChanged = vi.fn();
    renderDashboard({ deactivate, onChanged });

    await screen.findByText('My Protocol');
    expect(screen.getByText('Active')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /^deactivate$/i }));

    await waitFor(() => expect(screen.getByText('Deactivated')).toBeTruthy());
    expect(deactivate).toHaveBeenCalledWith(C1, OWNER);
    // The parent is told, so the global "recently registered" list can refresh.
    expect(onChanged).toHaveBeenCalled();
    // And the row is not re-fetched from a registry that lags the ledger.
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('shows the wallet-rejection message against the row and leaves it active', async () => {
    const deactivate = vi.fn(async () => {
      throw new ContractCallError('Signature was declined in your wallet.', 'awaiting-signature');
    });
    renderDashboard({ deactivate });

    await screen.findByText('My Protocol');
    await userEvent.click(screen.getByRole('button', { name: /^deactivate$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Signature was declined in your wallet.');
    // Crucially, the UI did not optimistically mark it deactivated.
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('keeps one row-s failure off the other rows', async () => {
    const deactivate = vi.fn(async (contractId: string) => {
      if (contractId === C1) throw new Error('nope');
    });
    renderDashboard({
      loadContracts: async () => [
        entry({ contractId: C1, name: 'First' }),
        entry({ contractId: C2, name: 'Second' }),
      ],
      deactivate,
    });

    await screen.findByText('First');
    const buttons = screen.getAllByRole('button', { name: /^deactivate$/i });
    await userEvent.click(buttons[0]);

    await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('renders history for a contract, newest first', async () => {
    const history = parseRegistryEvents([
      registryEvent(C1, 'contract_registered', 100),
      registryEvent(C1, 'contract_deactivated', 200),
      registryEvent(C2, 'contract_registered', 150),
    ]);
    renderDashboard({ loadHistory: async () => history });

    await screen.findByText('My Protocol');
    // Only this contract's two events are counted, not C2's.
    const toggle = await screen.findByRole('button', { name: /history \(2\)/i });
    await userEvent.click(toggle);

    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('Deactivated');
    expect(items[1].textContent).toContain('Registered');
  });

  it('says so when a contract has no indexed registry events', async () => {
    renderDashboard({ loadHistory: async () => [] });

    await screen.findByText('My Protocol');
    await userEvent.click(screen.getByRole('button', { name: /history \(0\)/i }));

    expect(screen.getByText(/no registry events indexed/i)).toBeTruthy();
  });

  it('distinguishes indexed activity from a contract that has emitted nothing', async () => {
    renderDashboard({
      loadContracts: async () => [
        entry({ contractId: C1, name: 'Busy' }),
        entry({ contractId: C2, name: 'Idle' }),
      ],
      loadActivity: async () =>
        new Map([
          [C1, 'active' as const],
          [C2, 'quiet' as const],
        ]),
    });

    await screen.findByText('Busy');
    await waitFor(() => expect(screen.getByText('Indexed activity')).toBeTruthy());
    expect(screen.getByText('No events yet')).toBeTruthy();
  });

  it('falls back to an unknown activity state rather than claiming silence', async () => {
    renderDashboard({ loadActivity: async () => new Map([[C1, 'unknown' as const]]) });

    await screen.findByText('My Protocol');
    await waitFor(() => expect(screen.getByText('Activity unknown')).toBeTruthy());
  });

  it('still renders the contracts when the indexer is unreachable', async () => {
    // History and activity are decoration; a successful registry read must not
    // be hidden because the GraphQL side is down.
    renderDashboard({
      loadHistory: async () => {
        throw new Error('graphql down');
      },
      loadActivity: async () => {
        throw new Error('graphql down');
      },
    });

    expect(await screen.findByText('My Protocol')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
