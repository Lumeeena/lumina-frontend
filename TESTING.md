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
  `window`, so importing the package itself fails at *collection* time — before
  any assertion runs. `lib/wallet.ts` imports it lazily on the first wallet
  call, so importing the wallet module is safe; reach the kit only behind
  `vi.mock`, as `lib/wallet.test.ts` does. The same laziness keeps the kit out
  of the registry route's initial bundle, and the loader memoises its promise
  for the life of the module — so a test asserting the kit arrives on the first
  wallet call has to be the first kit-touching test in its file.
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

### Two things E2E cannot see, and where they are covered instead

Both of these look like E2E work and are not:

**The server-rendered loading skeleton.** The suite's backend refuses the
connection immediately, so a server route spends a few milliseconds in its
loading boundary — gone before a browser can poll for it. `page.route`
intercepts the *browser's* requests, not the app server's own fetch, so it
cannot stall one either. Asserting on a frame that brief would be a flaky test
disguised as coverage. `app/slowApi.test.tsx` holds the response open with a
promise the test resolves itself, which is the only way to observe the skeleton
actually appearing, and what it must announce while it is there. What E2E
*can* check is the thing after: that no route comes to rest still showing a
skeleton it never left.

**A `role="status"` element is not a loading state.** The live-feed connection
indicator is one too, and against a dead socket it sits in `RECONNECTING` for
the whole test. Match skeletons by their accessible name
(`getByRole("status", { name: /^Loading / })`) rather than by role, or a
perfectly healthy indicator reads as a stuck page.

### Crawling metadata

`e2e/seo.spec.ts` asserts the metadata *files* the way a crawler meets them:
the served `Content-Type`, absolute canonical and `og:image` URLs, and the
`IHDR` chunk of the generated PNGs to confirm they really are 1200×630. A page
can build a flawless metadata object and still serve a 404 image or a relative
URL, and only a request against the running app catches that.

Pin the canonical's *path*, never its host. The host comes from
`NEXT_PUBLIC_SITE_URL` at build time, so asserting it fails on every machine
that is not production.

## Visual regression

`e2e/visual.spec.ts` takes a full-page screenshot of each stable route and
compares it against a committed baseline, so a CSS change that breaks a layout
fails CI even though every behavioural test still passes. The connection
indicator and the footer version are masked because they change without the
layout changing.

The suite skips itself while no baselines exist, so it stays green until you
add them. Baselines only match the OS and fonts they were made on, so generate
them on the CI platform (Linux), not on a laptop:

```bash
npx playwright test e2e/visual.spec.ts --update-snapshots
```

That writes `e2e/visual.spec.ts-snapshots/`; commit the directory.

**Accepting an intended change** is one step: re-run the command above, review
the changed images in the diff, and commit them with the change that caused them.

Dark mode is not covered yet. Once it lands, add a second pass over the same
routes with the dark colour scheme so both themes are compared.

## Coverage

`npm run test:coverage` writes `text`, `html` and `lcov` reports to `coverage/`.
There is no hard threshold: a gate chosen today would be picked to pass today
rather than to mean anything. The report exists so a drop is visible in review.
