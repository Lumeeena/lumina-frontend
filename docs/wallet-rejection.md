# Retrying a declined wallet signature

Registration, stake, withdrawal and deactivation retain their inputs when the
wallet declines a signature. A neutral status explains the cancellation and
offers **Retry signature**. Retrying signs the same prepared unsigned XDR without
another account lookup or simulation. Ordinary wallet, RPC and transaction errors
remain failures; submission is never automatically retried.

Changing registration inputs or a stake amount invalidates the saved retry. A
different wallet cannot reuse it. Prepared transactions stay in component memory,
not local storage, and are discarded on navigation. The real driver's 60-second
transaction deadline still applies: an expired retry asks the user to submit again
while preserving their inputs. A successfully signed transaction cannot be retried
through the saved cancellation action.

Regression coverage lives beside the transaction pipeline and registration/owner
components. Run `npx vitest run lib/sorobanTx.test.ts
components/RegisterContractForm.integration.test.tsx components/OwnerContracts.test.tsx`.
