// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WatchAlertSettings from './WatchAlertSettings';
import { DEFAULT_OPERATION_FILTERS } from '@/lib/operationFilters';
import * as watches from '@/lib/watches';

const TEST_ADDRESS = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS';

vi.mock('@/lib/watches', async () => {
  const actual = await vi.importActual('@/lib/watches');
  return {
    ...actual,
    setWatchFilters: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe('WatchAlertSettings', () => {
  it('renders with default filters', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    expect(screen.getByLabelText(/operation/i)).toBeTruthy();
    expect(screen.getByLabelText(/minimum amount/i)).toBeTruthy();
    expect(screen.getByLabelText(/asset/i)).toBeTruthy();
  });

  it('displays the operation type select with correct value', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const select = screen.getByLabelText(/operation/i) as HTMLSelectElement;
    expect(select.value).toBe('PAYMENT');
  });

  it('changes operation type when user selects a different option', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const select = screen.getByLabelText(/operation/i);
    await user.selectOptions(select, 'CREATE_ACCOUNT');
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ operationType: 'CREATE_ACCOUNT' })
      );
    });
  });

  it('displays "Any operation" option for "all" filter', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={{ ...DEFAULT_OPERATION_FILTERS, operationType: 'all' }}
      />
    );
    
    const select = screen.getByLabelText(/operation/i) as HTMLSelectElement;
    expect(select.value).toBe('all');
    const option = Array.from(select.options).find(opt => opt.value === 'all');
    expect(option?.textContent).toBe('Any operation');
  });

  it('formats operation type labels in title case', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const select = screen.getByLabelText(/operation/i) as HTMLSelectElement;
    const option = Array.from(select.options).find(opt => opt.value === 'CREATE_ACCOUNT');
    expect(option?.textContent).toBe('Create account');
  });

  it('updates minimum amount when user enters a value', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const input = screen.getByLabelText(/minimum amount/i);
    await user.clear(input);
    await user.type(input, '100');
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ minAmount: 100 })
      );
    });
  });

  it('clears minimum amount when input is emptied', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={{ ...DEFAULT_OPERATION_FILTERS, minAmount: 50 }}
      />
    );
    
    const input = screen.getByLabelText(/minimum amount/i) as HTMLInputElement;
    expect(input.value).toBe('50');
    
    await user.clear(input);
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ minAmount: null })
      );
    });
  });

  it('handles decimal minimum amount values', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const input = screen.getByLabelText(/minimum amount/i);
    await user.clear(input);
    await user.type(input, '12.5');
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ minAmount: 12.5 })
      );
    });
  });

  it('rejects negative minimum amount', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const input = screen.getByLabelText(/minimum amount/i);
    await user.clear(input);
    await user.type(input, '-10');
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ minAmount: null })
      );
    });
  });

  it('accepts zero as a valid minimum amount', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const input = screen.getByLabelText(/minimum amount/i);
    await user.clear(input);
    await user.type(input, '0');
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ minAmount: 0 })
      );
    });
  });

  it('updates asset filter when user types', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const input = screen.getByLabelText(/asset/i);
    await user.type(input, 'USD');
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ asset: 'USD' })
      );
    });
  });

  it('displays asset input with mono font', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const input = screen.getByLabelText(/asset/i);
    expect(input.className).toContain('mono');
  });

  it('shows active filter count when no filters are set', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={{ operationType: 'all', minAmount: null, asset: '' }}
      />
    );
    
    expect(screen.getByTestId('watch-alert-active-count').textContent).toBe(
      'No filter — every operation alerts.'
    );
  });

  it('shows active filter count with one filter', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    expect(screen.getByTestId('watch-alert-active-count').textContent).toBe(
      '1 filter active.'
    );
  });

  it('shows active filter count with multiple filters', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={{ operationType: 'PAYMENT', minAmount: 100, asset: 'USD' }}
      />
    );
    
    expect(screen.getByTestId('watch-alert-active-count').textContent).toBe(
      '3 filters active.'
    );
  });

  it('shows reset button when filters differ from default', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={{ operationType: 'all', minAmount: null, asset: '' }}
      />
    );
    
    expect(screen.getByRole('button', { name: /reset to default/i })).toBeTruthy();
  });

  it('hides reset button when filters match default', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    expect(screen.queryByRole('button', { name: /reset to default/i })).toBeNull();
  });

  it('resets filters to default when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={{ operationType: 'all', minAmount: 50, asset: 'EUR' }}
      />
    );
    
    const resetButton = screen.getByRole('button', { name: /reset to default/i });
    await user.click(resetButton);
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        DEFAULT_OPERATION_FILTERS
      );
    });
  });

  it('adopts new filters from props without clobbering draft', async () => {
    const { rerender } = render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const newFilters = { operationType: 'CREATE_ACCOUNT' as const, minAmount: null, asset: '' };
    rerender(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={newFilters}
      />
    );
    
    await waitFor(() => {
      const select = screen.getByLabelText(/operation/i) as HTMLSelectElement;
      expect(select.value).toBe('CREATE_ACCOUNT');
    });
  });

  it('has accessible fieldset with legend', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const fieldset = screen.getByTestId('watch-alert-settings');
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(screen.getByText(`Alert filter for ${TEST_ADDRESS}`)).toBeTruthy();
  });

  it('uses unique IDs for form controls based on address', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const typeSelect = screen.getByLabelText(/operation/i);
    const amountInput = screen.getByLabelText(/minimum amount/i);
    const assetInput = screen.getByLabelText(/asset/i);
    
    expect(typeSelect.id).toContain(TEST_ADDRESS);
    expect(amountInput.id).toContain(TEST_ADDRESS);
    expect(assetInput.id).toContain(TEST_ADDRESS);
  });

  it('sets data-address attribute on fieldset', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const fieldset = screen.getByTestId('watch-alert-settings');
    expect(fieldset.getAttribute('data-address')).toBe(TEST_ADDRESS);
  });

  it('applies grid layout for responsive design', () => {
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const fieldset = screen.getByTestId('watch-alert-settings');
    expect(fieldset.className).toContain('grid');
    expect(fieldset.className).toContain('sm:grid-cols-3');
  });

  it('handles unparseable amount input gracefully', async () => {
    const user = userEvent.setup();
    render(
      <WatchAlertSettings
        address={TEST_ADDRESS}
        filters={DEFAULT_OPERATION_FILTERS}
      />
    );
    
    const input = screen.getByLabelText(/minimum amount/i);
    await user.clear(input);
    await user.type(input, 'abc');
    
    await waitFor(() => {
      expect(watches.setWatchFilters).toHaveBeenCalledWith(
        TEST_ADDRESS,
        expect.objectContaining({ minAmount: null })
      );
    });
  });
});
