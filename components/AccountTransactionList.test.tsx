// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Transaction } from '@/lib/types';

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock('@/lib/graphql', () => ({
  gqlFetch,
  PUBLIC_GRAPHQL_URL: 'http://test/graphql',
}));

import AccountTransactionList from './AccountTransactionList';

const ADDRESS = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS';

function tx(ledger: number): Transaction {
  return {
    hash: `hash${ledger}hash${ledger}hash${ledger}hash${ledger}hash${ledger}hash${ledger}`,
    ledger,
    createdAt: new Date().toISOString(),
    sourceAccount: ADDRESS,
    feeCharged: '1000000',
    operationCount: 1,
    successful: true,
    memoType: null,
    memo: null,
  };
}

const count = (n: number) => Array.from({ length: n }, (_, i) => tx(1000 - i));

/** Stub the one query the list makes: account.transactions(limit:). */
function mockAccountTransactions(txs: Transaction[]) {
  gqlFetch.mockResolvedValue({ account: { transactions: txs } });
}

beforeEach(() => {
  gqlFetch.mockReset();
});

afterEach(cleanup);

describe('AccountTransactionList', () => {
  it('labels the seed as a sample, not the whole history', async () => {
    render(<AccountTransactionList address={ADDRESS} initial={count(10)} />);

    expect(await screen.findByTestId('transaction-count')).toHaveTextContent(
      'Showing the 10 most recent transactions'
    );
  });

  it('says so when the account has nothing older', async () => {
    render(<AccountTransactionList address={ADDRESS} initial={count(3)} />);

    expect(await screen.findByTestId('transaction-count')).toHaveTextContent('All 3 transactions');
  });

  it('widens the limit on load more and keeps only the new tail', async () => {
    mockAccountTransactions(count(25));
    render(<AccountTransactionList address={ADDRESS} initial={count(10)} />);

    await userEvent.click(await screen.findByRole('button', { name: /load more/i }));

    await waitFor(() =>
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Showing the 25 most recent transactions'
      )
    );
    expect(gqlFetch.mock.calls[0][2]).toMatchObject({ address: ADDRESS, limit: 25 });
    // 25 rows, not 10 + 25: the overlap is deduped.
    expect(screen.getAllByRole('row')).toHaveLength(25);
  });

  it('stops at a short page and calls it the complete set', async () => {
    mockAccountTransactions(count(13));
    render(<AccountTransactionList address={ADDRESS} initial={count(10)} />);

    await userEvent.click(await screen.findByRole('button', { name: /load more/i }));

    await waitFor(() =>
      expect(screen.getByTestId('transaction-count')).toHaveTextContent('All 13 transactions')
    );
    expect(screen.getByText('End of results')).toBeTruthy();
    // No further requests once the account is exhausted.
    expect(gqlFetch).toHaveBeenCalledTimes(1);
  });

  it('offers a retry when a page fails to load', async () => {
    gqlFetch.mockRejectedValue(new Error('GraphQL request failed (502)'));
    render(<AccountTransactionList address={ADDRESS} initial={count(10)} />);

    await userEvent.click(await screen.findByRole('button', { name: /load more/i }));

    expect(await screen.findByText('Could not load more transactions.')).toBeTruthy();

    mockAccountTransactions(count(25));
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Showing the 25 most recent transactions'
      )
    );
  });

  it('renders an empty state instead of an empty table', () => {
    render(<AccountTransactionList address={ADDRESS} initial={[]} />);

    expect(screen.getByText('No transactions yet.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
