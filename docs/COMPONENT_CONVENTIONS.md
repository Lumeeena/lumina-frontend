# Component conventions

How a component in this repo is placed, named, shaped and made testable. The
examples below are real files; when this page and a file disagree, the file is
the one to copy and this page should be fixed.

## Where a component lives

- **Page-level UI** lives in `components/`, one component per file. A route
  file in `app/<route>/page.tsx` composes them and owns the data loading.
- **Design-system primitives** (buttons, form fields, dialogs, toasts) live in
  `components/ui/`. Import them from there, not from a copy elsewhere:
  `components/ui/Button.tsx`, `components/ui/FormField.tsx`.
- **Heavy or rarely used components** are loaded with `lazy` from the route, so
  they stay out of the first bundle. `app/registry/page.tsx` does this for
  `RegisterContractForm` and `OwnerContracts`.
- **Logic a component needs** goes in `lib/`, not the component. Fetching,
  formatting, contract calls and hooks (`lib/useNetwork.ts`) are all there.

## When something becomes shared

Keep a component next to the one route that uses it until a second place needs
it. Move it to `components/` (or `components/ui/` if it is a generic primitive)
when a second caller appears. Do not pre-share: a component with one caller and
speculative props is harder to change than a local one.

A shared component must not know which route renders it. It takes what it
shows as props and reads the URL only through a hook such as `useNetwork`.

## Naming

- The file name is the component name, in PascalCase: `CopyAddressButton.tsx`
  exports `CopyAddressButton`.
- Use `export default function Name`, so the import name is the file name.
- Props are an exported interface called `NameProps` (or declared inline when it
  is three fields or fewer). See `components/RegistryContractInfo.tsx`.
- A test sits beside the file: `components/Footer.tsx` and
  `components/Footer.test.tsx`.

## Props and state

- **Destructure with defaults** in the signature. A prop with a sensible default
  is optional in the type: `variant = "address"` in `CopyAddressButton`.
- **Keep state local.** Use `useState` for what only this component shows.
  Anything the URL already says (network, category filter) comes from the URL,
  not a copy in state. `app/registry/page.tsx` reads `category` from the search
  params for this reason.
- **`"use client"` only when needed**: state, effects, event handlers, or
  browser APIs. `components/ContractLink.tsx` has none and stays a server
  component. `components/RegistryContractInfo.tsx` needs an effect, so it has
  the directive.
- **Colors come from Tailwind utilities or `var(--color-…)` tokens**, never raw
  hex. The `custom/no-raw-hex-colors` lint rule enforces this in `components/`.

## Dependency injection for testability

A component that talks to the network or the wallet takes the operation as a
prop, with the real implementation as the default. Tests pass a fake; the app
passes nothing.

```tsx
// components/RegisterContractForm.tsx
export interface RegisterContractFormProps {
  walletAddress: string;
  register?: (input: RegistrationInput, owner: string, /* … */) => Promise<…>;
  transactionWait?: (ms: number) => Promise<void>;
}

export default function RegisterContractForm({
  register = defaultRegister,
  transactionWait,
  // …
}: RegisterContractFormProps) { /* … */ }
```

`components/RegistryContractInfo.tsx` does the same with `readVersion`, so its
test can show a mismatch without an RPC call.

Lib functions use the same pattern with default parameters, so every
contract-reading function can be pointed at a different registry or RPC:

```ts
// lib/registry.ts
export async function getRegistryVersion(
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE,
): Promise<number> { /* … */ }
```

Pass the injectable piece through, not the whole module. A component that only
needs one read takes that read as a prop instead of importing the module and
hard-coding the call.

## Worked example

To add a small read-only panel, following the conventions above:

1. Put the data read in `lib/<topic>.ts` with default-parameter injection, and
   a unit test beside it. No React imports in `lib/`.
2. Create `components/<Topic>Panel.tsx` with an exported `<Topic>PanelProps`
   interface. Take the read as an optional prop defaulting to the lib function.
3. Add `"use client"` only if the panel has an effect or handler. A panel that
   only renders props stays on the server.
4. Use `components/ui/` primitives and token colors. No raw hex.
5. Import it in the route with a plain `import`, or with `lazy` if it is large.
6. Write `components/<Topic>Panel.test.tsx` that passes a fake read.

## Checklist

- [ ] File and default export share a PascalCase name.
- [ ] Props interface is exported; optional props have defaults.
- [ ] No fetching or contract logic inline; it lives in `lib/`.
- [ ] `"use client"` present only if the component needs it.
- [ ] Injectable operation for anything that touches the network or wallet.
- [ ] Colors are tokens or Tailwind utilities.
- [ ] Test beside the component.
