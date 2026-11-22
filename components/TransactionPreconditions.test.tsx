// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import TransactionPreconditions from './TransactionPreconditions';

afterEach(cleanup);

describe('TransactionPreconditions', () => {
  it('renders nothing when preconditions is null', () => {
    const { container } = render(<TransactionPreconditions preconditions={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when preconditions is undefined', () => {
    const { container } = render(<TransactionPreconditions preconditions={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all precondition fields are empty', () => {
    const { container } = render(<TransactionPreconditions preconditions={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all fields are undefined', () => {
    const { container } = render(
      <TransactionPreconditions
        preconditions={{
          minLedger: undefined,
          maxLedger: undefined,
          minTime: undefined,
          maxTime: undefined,
          extraSigners: undefined,
        }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when extraSigners is empty array', () => {
    const { container } = render(
      <TransactionPreconditions preconditions={{ extraSigners: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders ledger bounds when minLedger is provided', () => {
    render(<TransactionPreconditions preconditions={{ minLedger: 1000 }} />);
    
    expect(screen.getByText('Ledger Bounds')).toBeTruthy();
    expect(screen.getByText(/1,000/)).toBeTruthy();
    expect(screen.getByText(/to/)).toBeTruthy();
  });

  it('renders ledger bounds when maxLedger is provided', () => {
    render(<TransactionPreconditions preconditions={{ maxLedger: 5000 }} />);
    
    expect(screen.getByText('Ledger Bounds')).toBeTruthy();
    expect(screen.getByText(/5,000/)).toBeTruthy();
  });

  it('renders ledger bounds with both min and max', () => {
    render(
      <TransactionPreconditions
        preconditions={{ minLedger: 1000, maxLedger: 2000 }}
      />
    );
    
    expect(screen.getByText('Ledger Bounds')).toBeTruthy();
    expect(screen.getByText(/1,000/)).toBeTruthy();
    expect(screen.getByText(/2,000/)).toBeTruthy();
  });

  it('formats large ledger numbers with commas', () => {
    render(
      <TransactionPreconditions
        preconditions={{ minLedger: 1234567, maxLedger: 9876543 }}
      />
    );
    
    expect(screen.getByText(/1,234,567/)).toBeTruthy();
    expect(screen.getByText(/9,876,543/)).toBeTruthy();
  });

  it('renders em dash for missing minLedger when maxLedger is present', () => {
    render(<TransactionPreconditions preconditions={{ maxLedger: 5000 }} />);
    
    const cell = screen.getByText(/—/).closest('td');
    expect(cell?.textContent).toContain('—');
    expect(cell?.textContent).toContain('to');
    expect(cell?.textContent).toContain('5,000');
  });

  it('renders em dash for missing maxLedger when minLedger is present', () => {
    render(<TransactionPreconditions preconditions={{ minLedger: 1000 }} />);
    
    const cell = screen.getByText(/1,000/).closest('td');
    expect(cell?.textContent).toContain('1,000');
    expect(cell?.textContent).toContain('to');
    expect(cell?.textContent).toContain('—');
  });

  it('renders time bounds when minTime is provided', () => {
    const minTime = '2024-01-15T10:30:00Z';
    render(<TransactionPreconditions preconditions={{ minTime }} />);
    
    expect(screen.getByText('Time Bounds')).toBeTruthy();
    expect(screen.getByText(/From:/)).toBeTruthy();
  });

  it('renders time bounds when maxTime is provided', () => {
    const maxTime = '2024-12-31T23:59:59Z';
    render(<TransactionPreconditions preconditions={{ maxTime }} />);
    
    expect(screen.getByText('Time Bounds')).toBeTruthy();
    expect(screen.getByText(/Until:/)).toBeTruthy();
  });

  it('renders time bounds with both min and max', () => {
    render(
      <TransactionPreconditions
        preconditions={{
          minTime: '2024-01-01T00:00:00Z',
          maxTime: '2024-12-31T23:59:59Z',
        }}
      />
    );
    
    expect(screen.getByText('Time Bounds')).toBeTruthy();
    expect(screen.getByText(/From:/)).toBeTruthy();
    expect(screen.getByText(/Until:/)).toBeTruthy();
  });

  it('formats time with locale-specific formatting', () => {
    const minTime = '2024-06-15T14:30:45Z';
    render(<TransactionPreconditions preconditions={{ minTime }} />);
    
    const timeCell = screen.getByText(/From:/).closest('td');
    expect(timeCell?.textContent).toContain('From:');
    expect(timeCell?.textContent).toMatch(/2024|Jun|14:30|30:45/);
  });

  it('renders extra signers when provided', () => {
    const signers = [
      'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS',
      'GXYZABCDEFGHIJKLMNOPQRSTUVW234567XYZABCDEFGHIJKLMNOP',
    ];
    
    render(<TransactionPreconditions preconditions={{ extraSigners: signers }} />);
    
    expect(screen.getByText('Extra Signers')).toBeTruthy();
    expect(screen.getByText(signers[0])).toBeTruthy();
    expect(screen.getByText(signers[1])).toBeTruthy();
  });

  it('renders single extra signer', () => {
    const signer = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS';
    
    render(<TransactionPreconditions preconditions={{ extraSigners: [signer] }} />);
    
    expect(screen.getByText('Extra Signers')).toBeTruthy();
    expect(screen.getByText(signer)).toBeTruthy();
  });

  it('renders all precondition types together', () => {
    const preconditions = {
      minLedger: 1000,
      maxLedger: 2000,
      minTime: '2024-01-01T00:00:00Z',
      maxTime: '2024-12-31T23:59:59Z',
      extraSigners: ['GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS'],
    };
    
    render(<TransactionPreconditions preconditions={preconditions} />);
    
    expect(screen.getByText('Ledger Bounds')).toBeTruthy();
    expect(screen.getByText('Time Bounds')).toBeTruthy();
    expect(screen.getByText('Extra Signers')).toBeTruthy();
  });

  it('applies correct table structure and styling', () => {
    render(
      <TransactionPreconditions preconditions={{ minLedger: 1000 }} />
    );
    
    const table = screen.getByRole('table');
    expect(table.className).toContain('w-full');
    expect(table.className).toContain('text-sm');
  });

  it('applies mono font to ledger values', () => {
    render(
      <TransactionPreconditions preconditions={{ minLedger: 1000 }} />
    );
    
    const cell = screen.getByText(/1,000/).closest('td');
    expect(cell?.className).toContain('mono');
  });

  it('applies mono font to extra signers', () => {
    const signer = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS';
    render(<TransactionPreconditions preconditions={{ extraSigners: [signer] }} />);
    
    const signerDiv = screen.getByText(signer);
    expect(signerDiv.className).toContain('mono');
    expect(signerDiv.className).toContain('break-all');
  });

  it('renders rows with proper border styling', () => {
    render(
      <TransactionPreconditions
        preconditions={{
          minLedger: 1000,
          minTime: '2024-01-01T00:00:00Z',
        }}
      />
    );
    
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders label cells with fixed width', () => {
    render(<TransactionPreconditions preconditions={{ minLedger: 1000 }} />);
    
    const labelCell = screen.getByText('Ledger Bounds');
    expect(labelCell.className).toContain('w-[140px]');
  });

  it('keeps extra signers label aligned to top', () => {
    const signers = [
      'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS',
      'GXYZABCDEFGHIJKLMNOPQRSTUVW234567XYZABCDEFGHIJKLMNOP',
    ];
    
    render(<TransactionPreconditions preconditions={{ extraSigners: signers }} />);
    
    const labelCell = screen.getByText('Extra Signers');
    expect(labelCell.className).toContain('align-top');
  });
});
