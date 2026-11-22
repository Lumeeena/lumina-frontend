// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimezoneToggle from './TimezoneToggle';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('TimezoneToggle', () => {
  it('renders with system timezone by default', () => {
    render(<TimezoneToggle />);
    const button = screen.getByRole('button');
    
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('📍');
    expect(button.getAttribute('aria-label')).toContain('Current');
  });

  it('switches from system to UTC on click', async () => {
    const user = userEvent.setup();
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    expect(button.textContent).toBe('📍');
    
    await user.click(button);
    
    expect(button.textContent).toBe('🌍');
  });

  it('switches from UTC back to system on click', async () => {
    const user = userEvent.setup();
    localStorage.setItem('lumina-timezone', 'UTC');
    
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(button.textContent).toBe('📍');
  });

  it('persists UTC selection to localStorage', async () => {
    const user = userEvent.setup();
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(localStorage.getItem('lumina-timezone')).toBe('UTC');
  });

  it('removes localStorage item when switching back to system', async () => {
    const user = userEvent.setup();
    localStorage.setItem('lumina-timezone', 'UTC');
    
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(localStorage.getItem('lumina-timezone')).toBeNull();
  });

  it('loads timezone preference from localStorage on mount', () => {
    localStorage.setItem('lumina-timezone', 'UTC');
    
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    expect(button.textContent).toBe('🌍');
  });

  it('has accessible aria-label that describes current state and action', () => {
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    const label = button.getAttribute('aria-label');
    
    expect(label).toContain('Current');
    expect(label).toContain('Click to switch');
  });

  it('has a title attribute for tooltip', () => {
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    expect(button.getAttribute('title')).toBeTruthy();
  });

  it('applies hover and transition styles', () => {
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('transition-colors');
    expect(button.className).toContain('hover:text-');
    expect(button.className).toContain('hover:bg-');
  });

  it('handles rapid clicks without breaking', async () => {
    const user = userEvent.setup();
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    
    await user.click(button);
    await user.click(button);
    await user.click(button);
    
    expect(button.textContent).toBe('🌍');
    expect(localStorage.getItem('lumina-timezone')).toBe('UTC');
  });

  it('handles keyboard interaction', async () => {
    const user = userEvent.setup();
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await user.keyboard('{Enter}');
    
    expect(button.textContent).toBe('🌍');
  });

  it('handles space key to toggle', async () => {
    const user = userEvent.setup();
    render(<TimezoneToggle />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await user.keyboard(' ');
    
    expect(button.textContent).toBe('🌍');
  });
});
