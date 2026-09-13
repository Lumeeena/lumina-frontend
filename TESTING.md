# Testing

```bash
npm test              # unit + component tests (vitest)
npm run test:watch    # the same, in watch mode
npm run test:coverage # with a coverage report in ./coverage
npm run test:e2e      # Playwright, against a production build
```

CI runs both suites on every PR and uploads the coverage and Playwright reports
as artifacts.

## Where a test goes

| What you changed | Where the test goes | Environment |
| --- | --- | --- |
| A pure function in `lib/` | `lib/thing.test.ts` | node (default) |
| A React component | `components/Thing.test.tsx` | jsdom |
| A page's data fetching or fallback | `app/pages.test.tsx` | jsdom |
| A whole user journey across routes | `e2e/*.spec.ts` | Playwright |

Node is the default environment because most of what is worth testing here is
plain TypeScript, and paying jsdom's startup cost for all of it would be slow.
A component test opts in per file with a first-line pragma:

```ts
// @vitest-environment jsdom
```

## Making things testable

Two patterns cover almost everything in this codebase.

**Inject the dependency, default to the real one.** A component that fetches or
signs takes those as optional props:

```tsx
export default function OwnerContracts({
  walletAddress,
  loadContracts = defaultLoadContracts,
  deactivate = defaultDeactivate,
}: OwnerContractsProps) { /* … */ }
```

Production passes nothing; tests pass a fake. No network, no wallet extension,
and every failure branch is reachable — see `components/OwnerContracts.test.tsx`.

**Depend on a narrow interface, not a library.** `lib/sorobanTx.ts` talks to a
three-method `ContractCallDriver` rather than to `@stellar/stellar-sdk`
directly. The real driver wraps the SDK; the tests pass a fake and can make any
step fail. Keep such an interface small — once it grows, the fake stops being
obviously equivalent to the real thing and the tests stop meaning much.

## Things that will bite you

- **The wallet kit cannot be imported outside a browser.**
  `@creit.tech/stellar-wallets-kit` pulls in CommonJS bundles that assume
  `window`, and a static import of `lib/wallet.ts` fails at *collection* time —
  before any assertion runs. Import it lazily at the point of signing
  (`const { signWithWallet } = await import('@/lib/wallet')`), or mock the kit
  wholesale as `lib/wallet.test.ts` does.
- **`vi.mock` is hoisted above everything**, so its factory cannot close over
  file-scope variables. Use `vi.hoisted()` for shared mock state, and write
  repeated mocks out one by one rather than generating them in a loop.
- **`userEvent` deadlocks against fake timers.** For a component with a
  `setTimeout`, use `fireEvent` plus `act(() => vi.advanceTimersByTime(n))`.
  `components/CopyAddressButton.test.tsx` is the reference.
- **jsdom gives every element zero size**, so virtualized lists render nothing.
  `useVirtualizer` needs `offsetHeight` stubbed, not just
  `getBoundingClientRect` — see `components/TransactionExplorer.test.tsx`.
- **`navigator.clipboard` is getter-only** in jsdom; redefine it with
  `Object.defineProperty`, not `Object.assign`.
- **Pages are async server components.** Call the page and `await` it, then
  render the result: `render(await StatsPage())`.

## What E2E is for

The Playwright suite runs against a production build with the GraphQL backend
pointed at a dead port. That is deliberate: it proves every route renders, the
nav works, and nothing white-screens when the indexer is down — the failure mode
users are most likely to meet, and one no unit test can catch because it depends
on the real server/client component split.

Assertions about specific data belong in component and page tests, where the
response can be pinned exactly. Don't reach for E2E to check a number.

## Coverage

`npm run test:coverage` writes `text`, `html` and `lcov` reports to `coverage/`.
There is no hard threshold: a gate chosen today would be picked to pass today
rather than to mean anything. The report exists so a drop is visible in review.
