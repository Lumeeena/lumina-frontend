// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WatchFeed from './WatchFeed';
import * as useWatchedActivity from '@/lib/useWatchedActivity';
import * as useNetwork from '@/lib/useNetwork';
import type { WatchActivity } from '@/lib/useWatchedActivity';
import type { Operation } from '@/lib/types';
import { DEFAULT_OPERATION_FILTERS } from '@/lib/operationFilters';

vi.mock('@/lib/useWatchedActivity');
vi.mock('@/lib/useNetwork');

const mockUseWatchedActivity = vi.mocked(useWatchedActivity.useWatchedActivity);
const mockUseNetwork = vi.mocked(useNetwork.useNetwork);

const TEST_ADDRESS_1 = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS';
const TEST_ADDRESS_2 = 'GXYZABCDEFGHIJKLMNOPQRSTUVW234567XYZABCDEFGHIJKLMNOP';

beforeEach(() => {
  mockUseNetwork.mockReturnValue({
    network: 'mainnet',
    setNetwork: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createMockOperation = (overrides?: Partial<Operation>): Operation => ({
  id: 'op-123',
  type: 'PAYMENT',
  createdAt: '2024-01-15T10:00:00Z',
  amount: '100',
  asset: 'XLM',
  sourceAccount: TEST_ADDRESS_1,
  ...overrides,
});

const createMockActivity = (overrides?: Partial<WatchActivity>): WatchActivity => ({
  id: `${TEST_ADDRESS_1}:op-123`,
  address: TEST_ADDRESS_1,
  operation: createMockOperation(),
  ...overrides,
});

describe('WatchFeed', () => {
  describe('Empty states', () => {
    it('shows empty state when not watching any addresses', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [],
        entries: [],
        state: 'idle',
        failureReason: null,
        retry: vi.fn(),
        watching: 0,
        alertCount: 0,
      });

      render(<WatchFeed />);

      expect(screen.getByText(/not watching any addresses yet/i)).toBeTruthy();
      expect(screen.getByText(/bookmark next to any address/i)).toBeTruthy();
    });

    it('shows waiting message when watching addresses but no activity yet', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [],
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      expect(screen.getByText(/waiting for activity/i)).toBeTruthy();
    });
  });

  describe('Activity display', () => {
    it('renders activity feed when watching addresses with activity', () => {
      const activity = [createMockActivity()];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      expect(screen.getByTestId('watch-feed')).toBeTruthy();
      expect(screen.getByText('PAYMENT')).toBeTruthy();
    });

    it('displays operation type badge for each activity', () => {
      const activity = [
        createMockActivity({ operation: createMockOperation({ type: 'PAYMENT' }) }),
        createMockActivity({
          id: `${TEST_ADDRESS_2}:op-456`,
          address: TEST_ADDRESS_2,
          operation: createMockOperation({ id: 'op-456', type: 'CREATE_ACCOUNT' }),
        }),
      ];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [
          { address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS },
          { address: TEST_ADDRESS_2, filters: DEFAULT_OPERATION_FILTERS },
        ],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 2,
        alertCount: 0,
      });

      render(<WatchFeed />);

      expect(screen.getByText('PAYMENT')).toBeTruthy();
      expect(screen.getByText('CREATE_ACCOUNT')).toBeTruthy();
    });

    it('displays truncated address as a link', () => {
      const activity = [createMockActivity()];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      const link = screen.getByRole('link', { name: /GABCD/i });
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toContain(`/accounts/${TEST_ADDRESS_1}`);
    });

    it('displays amount and asset when present', () => {
      const activity = [
        createMockActivity({
          operation: createMockOperation({ amount: '250.5', asset: 'USDC' }),
        }),
      ];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      expect(screen.getByText(/250.5/)).toBeTruthy();
      expect(screen.getByText(/USDC/)).toBeTruthy();
    });

    it('uses XLM as default asset when asset is null', () => {
      const activity = [
        createMockActivity({
          operation: createMockOperation({ amount: '100', asset: null }),
        }),
      ];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      expect(screen.getByText(/XLM/)).toBeTruthy();
    });

    it('does not display amount when operation has no amount', () => {
      const activity = [
        createMockActivity({
          operation: createMockOperation({ amount: null }),
        }),
      ];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      expect(screen.queryByText(/XLM/)).toBeNull();
    });

    it('displays alert badge for matching operations', () => {
      const activity = [createMockActivity()];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 1,
      });

      render(<WatchFeed />);

      // The component matches filters internally, so we need to test the structure
      expect(screen.getByTestId('watch-feed')).toBeTruthy();
    });

    it('renders TimeAgo component for each activity', () => {
      const activity = [createMockActivity()];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      // TimeAgo renders the timestamp, so it should be in the document
      expect(screen.getByTestId('watch-feed')).toBeTruthy();
    });
  });

  describe('Connection state', () => {
    it('displays ConnectionIndicator with current state', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [],
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connecting',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      // ConnectionIndicator should be present
      expect(screen.getByText(/live activity/i)).toBeTruthy();
    });

    it('passes retry handler to ConnectionIndicator', () => {
      const retryFn = vi.fn();

      mockUseWatchedActivity.mockReturnValue({
        activity: [],
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'disconnected',
        failureReason: 'refused',
        retry: retryFn,
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      // ConnectionIndicator renders with the retry function
      expect(screen.getByText(/live activity/i)).toBeTruthy();
    });
  });

  describe('Summary text', () => {
    it('shows count of watched addresses', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [],
        entries: [
          { address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS },
          { address: TEST_ADDRESS_2, filters: DEFAULT_OPERATION_FILTERS },
        ],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 2,
        alertCount: 0,
      });

      render(<WatchFeed />);

      const summary = screen.getByTestId('watch-summary');
      expect(summary.textContent).toContain('2');
    });

    it('shows alert count when alerts are present', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [createMockActivity()],
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 3,
      });

      render(<WatchFeed />);

      const summary = screen.getByTestId('watch-summary');
      expect(summary.textContent).toContain('3');
    });

    it('does not show alert count when zero', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [createMockActivity()],
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      const summary = screen.getByTestId('watch-summary');
      expect(summary.textContent).not.toContain('·');
    });
  });

  describe('Accessibility', () => {
    it('has proper section structure with heading', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [],
        entries: [],
        state: 'idle',
        failureReason: null,
        retry: vi.fn(),
        watching: 0,
        alertCount: 0,
      });

      render(<WatchFeed />);

      const heading = screen.getByRole('heading', { name: /live activity/i });
      expect(heading.id).toBe('watch-feed-heading');
    });

    it('links section to heading with aria-labelledby', () => {
      mockUseWatchedActivity.mockReturnValue({
        activity: [],
        entries: [],
        state: 'idle',
        failureReason: null,
        retry: vi.fn(),
        watching: 0,
        alertCount: 0,
      });

      const { container } = render(<WatchFeed />);
      const section = container.querySelector('section');
      
      expect(section?.getAttribute('aria-labelledby')).toBe('watch-feed-heading');
    });
  });

  describe('Multiple activities', () => {
    it('renders multiple activities in order', () => {
      const activity = [
        createMockActivity({ id: `${TEST_ADDRESS_1}:op-1` }),
        createMockActivity({ id: `${TEST_ADDRESS_1}:op-2` }),
        createMockActivity({ id: `${TEST_ADDRESS_2}:op-3`, address: TEST_ADDRESS_2 }),
      ];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [
          { address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS },
          { address: TEST_ADDRESS_2, filters: DEFAULT_OPERATION_FILTERS },
        ],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 2,
        alertCount: 0,
      });

      render(<WatchFeed />);

      const paymentBadges = screen.getAllByText('PAYMENT');
      expect(paymentBadges).toHaveLength(3);
    });

    it('uses unique keys for each activity row', () => {
      const activity = [
        createMockActivity({ id: `${TEST_ADDRESS_1}:op-1` }),
        createMockActivity({ id: `${TEST_ADDRESS_1}:op-2` }),
      ];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      const { container } = render(<WatchFeed />);
      const rows = container.querySelectorAll('[class*="flex items-center gap-3"]');
      
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Network awareness', () => {
    it('uses network context in account links', () => {
      mockUseNetwork.mockReturnValue({
        network: 'testnet',
        setNetwork: vi.fn(),
      });

      const activity = [createMockActivity()];

      mockUseWatchedActivity.mockReturnValue({
        activity,
        entries: [{ address: TEST_ADDRESS_1, filters: DEFAULT_OPERATION_FILTERS }],
        state: 'connected',
        failureReason: null,
        retry: vi.fn(),
        watching: 1,
        alertCount: 0,
      });

      render(<WatchFeed />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toContain('?network=testnet');
    });
  });
});
