// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TxPhase } from '@/lib/sorobanTx';
import RegisterContractForm, { type RegistrationInput } from './RegisterContractForm';

const OWNER = 'GOWNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const TARGET = 'CCONTRACTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

async function fillForm(description = 'A DeFi protocol') {
  await userEvent.type(screen.getByLabelText(/contract id/i), TARGET);
  await userEvent.type(screen.getByLabelText(/project name/i), 'My Protocol');
  if (description) {
    await userEvent.type(screen.getByLabelText(/description/i), description);
  }
}

afterEach(cleanup);

describe('RegisterContractForm', () => {
  it('submits the trimmed field values with the connected wallet as owner', async () => {
    const register = vi.fn(async () => {});
    render(<RegisterContractForm walletAddress={OWNER} register={register} />);

    await userEvent.type(screen.getByLabelText(/contract id/i), `  ${TARGET}  `);
    await userEvent.type(screen.getByLabelText(/project name/i), '  My Protocol  ');
    await userEvent.click(screen.getByRole('button', { name: /register contract/i }));

    await waitFor(() => expect(register).toHaveBeenCalled());
    const [input, owner] = register.mock.calls[0] as [RegistrationInput, string];
    expect(input).toMatchObject({ contractId: TARGET, name: 'My Protocol' });
    expect(owner).toBe(OWNER);
  });

  it('substitutes a placeholder description rather than sending an empty one', async () => {
    const register = vi.fn(async () => {});
    render(<RegisterContractForm walletAddress={OWNER} register={register} />);

    await fillForm('');
    await userEvent.click(screen.getByRole('button', { name: /register contract/i }));

    await waitFor(() => expect(register).toHaveBeenCalled());
    const [input] = register.mock.calls[0] as [RegistrationInput];
    expect(input.description).toBe('No description provided.');
  });

  it('reports progress through the wallet phases', async () => {
    let advance: (p: TxPhase) => void = () => {};
    const register = vi.fn(
      (_input: RegistrationInput, _owner: string, onPhase: (p: TxPhase) => void) => {
        advance = onPhase;
        return new Promise<void>(() => {});
      }
    );
    render(<RegisterContractForm walletAddress={OWNER} register={register} />);

    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /register contract/i }));

    await waitFor(() => expect(register).toHaveBeenCalled());

    advance('awaiting-signature');
    expect(await screen.findByRole('button', { name: /approve in your wallet/i })).toBeTruthy();

    advance('confirming');
    expect(await screen.findByRole('button', { name: /confirming/i })).toBeTruthy();
  });

  it('clears the form and reports success once confirmed', async () => {
    const onRegistered = vi.fn();
    render(
      <RegisterContractForm walletAddress={OWNER} register={async () => {}} onRegistered={onRegistered} />
    );

    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /register contract/i }));

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('My Protocol registered');
    expect((screen.getByLabelText(/contract id/i) as HTMLInputElement).value).toBe('');
    expect(onRegistered).toHaveBeenCalled();
  });

  it('shows the failure and keeps what the user typed', async () => {
    const register = vi.fn(async () => {
      throw new Error('Signature was declined in your wallet.');
    });
    render(<RegisterContractForm walletAddress={OWNER} register={register} />);

    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /register contract/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Signature was declined in your wallet.');
    // Retyping a contract ID after a declined signature would be miserable.
    expect((screen.getByLabelText(/contract id/i) as HTMLInputElement).value).toBe(TARGET);
  });

  it('does not submit twice while a submission is in flight', async () => {
    const register = vi.fn(() => new Promise<void>(() => {}));
    render(<RegisterContractForm walletAddress={OWNER} register={register} />);

    await fillForm();
    const button = screen.getByRole('button', { name: /register contract/i });
    await userEvent.click(button);
    await waitFor(() => expect(register).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('button'));
    expect(register).toHaveBeenCalledTimes(1);
  });
});
