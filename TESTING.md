# Testing

```bash
npm test              # unit + component tests (vitest)
npm run test:watch    # the same, in watch mode
npm run test:coverage # with a coverage report in ./coverage
npm run test:e2e      # Playwright, against a production build
```

CI runs both suites on every PR and uploads the coverage and Playwright reports
as artifacts.

## Hydration regressions

The Vitest setup fails any test that emits a React hydration warning or error.
Production React hydration error codes are included in the guard. SSR/hydration
tests use populated timestamps with different server and client clocks; the
Playwright hydration suite visits the route inventory in a different browser
locale and time zone and exercises a client control before checking diagnostics.

`TimeAgo` renders the supplied ISO timestamp on the server and during initial
hydration, then shows local relative time and a local-time tooltip in the browser.
Do not compute a fresh timestamp or read browser storage during an initial render.
A current storage value has no known timestamp and is labelled accordingly.

Run `npx vitest run components/TimeAgo.hydration.test.tsx` and
`npx playwright test e2e/hydration.spec.ts` for the focused checks.

## Where a test goes

| What you changed                   | Where the test goes         | Environment    |
| ---------------------------------- | --------------------------- | -------------- |
| A pure function in `lib/`          | `lib/thing.test.ts`         | node (default) |
| A React component                  | `components/Thing.test.tsx` | jsdom          |
| A page's data fetching or fallback | `app/pages.test.tsx`        | jsdom          |
| A whole user journey across routes | `e2e/*.spec.ts`             | Playwright     |

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
}: OwnerContractsProps) {
  /* … */
}
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
  `window`, so importing the package itself fails at _collection_ time — before
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
intercepts the _browser's_ requests, not the app server's own fetch, so it
cannot stall one either. Asserting on a frame that brief would be a flaky test
disguised as coverage. `app/slowApi.test.tsx` holds the response open with a
promise the test resolves itself, which is the only way to observe the skeleton
actually appearing, and what it must announce while it is there. What E2E
_can_ check is the thing after: that no route comes to rest still showing a
skeleton it never left.

**A `role="status"` element is not a loading state.** The live-feed connection
indicator is one too, and against a dead socket it sits in `RECONNECTING` for
the whole test. Match skeletons by their accessible name
(`getByRole("status", { name: /^Loading / })`) rather than by role, or a
perfectly healthy indicator reads as a stuck page.

### Crawling metadata

`e2e/seo.spec.ts` asserts the metadata _files_ the way a crawler meets them:
the served `Content-Type`, absolute canonical and `og:image` URLs, and the
`IHDR` chunk of the generated PNGs to confirm they really are 1200×630. A page
can build a flawless metadata object and still serve a 404 image or a relative
URL, and only a request against the running app catches that.

Pin the canonical's _path_, never its host. The host comes from
`NEXT_PUBLIC_SITE_URL` at build time, so asserting it fails on every machine
that is not production.

## Accessibility tree regression

`e2e/accessibility-tree.spec.ts` runs in Chromium against the production build.
It commits Playwright ARIA snapshots for the populated transaction table and
filters, navigation, the backend failure/retry view, and the empty watch form.
Browser GraphQL responses and time are fixed; service workers are blocked so
cached responses cannot bypass the fixture. This covers data rows as well as
the degraded shell scanned by axe. CI fails on changes to roles, names, heading
levels, control states, links or reading order, including extra or missing nodes.
The Playwright configuration uses `deep-equal` child matching so additional
nodes cannot silently pass a partial-tree comparison.

Run and deliberately update the readable baselines with:

```bash
npx playwright test e2e/accessibility-tree.spec.ts
npx playwright test e2e/accessibility-tree.spec.ts --update-snapshots
```

Commit the `.aria.yml` files with the change. Review their diff for lost labels,
headers, landmarks and controls before accepting it. Missing baselines fail CI;
they are never skipped. See [Playwright's snapshot documentation](https://playwright.dev/docs/aria-snapshots).

These are browser accessibility representations, not recordings of a screen
reader. They cannot prove spoken output, table header announcements, live-region
timing, keyboard/focus usability, virtualized rows outside the mounted window,
or whether wording is comprehensible. They cover English desktop Chromium,
not every locale, viewport, browser or assistive technology. axe remains a
separate check for mechanical WCAG failures.

The current transaction baseline exposes an unnamed status header and empty
status cells: success/failure is still conveyed visually. Capturing that markup
does not prove that a screen reader announces transaction status.

Before shipping an accessibility change, manually use NVDA with Firefox or
Chrome on Windows, and VoiceOver with Safari on macOS:

- Navigate landmarks and headings, then traverse transaction rows/cells; confirm
  each value has a comprehensible header and transaction success/failure is spoken.
- Tab through filters, retry, watch forms and menus; confirm focus order,
  visible focus, validation, and focus return after closing a menu or dialog.
- Scroll the virtualized table and confirm all rows remain discoverable.
- Disconnect/reconnect the backend and listen for loading, errors and live
  updates; check that announcements arrive once and do not interrupt reading.
- Repeat with zoom, a narrow viewport and a translated/RTL locale; check text
  meaning in context with a fluent speaker.

Record browser/screen reader versions, the journey, observations and failures
in the PR. No manual screen reader pass is claimed by the CI suite.

## Service worker cache regression

`scripts/service-worker.test.mjs` executes the shipped `public/sw.js` in a VM
with in-memory CacheStorage and real `Response`/`Headers` objects. It covers
asset hits/misses, HTTP failures, fresh offline data, expiry at the boundary,
undated/future data, invalidation, bypassed POSTs and deployment takeover.
It runs with `npm test` and the coverage job. It does not emulate browser worker
scheduling, quota eviction or HTTP cache revalidation.
`e2e/service-worker.spec.ts` also installs the real worker in Chromium, goes
offline, reads a cached response, then ages that entry to verify the browser
rejects it rather than serving stale content.

Immutable build assets are cache-first within the active worker version.
HTML and GET API responses are network-first, with a **five-minute maximum**
offline fallback. Expired entries are deleted. HTTP errors and `no-store`
responses invalidate an older success. A cache miss fails instead of presenting
the home page as a different route. The install shell contains only the manifest
and icons, so an old home page cannot bypass the data expiry rule. POST GraphQL
requests never enter the cache. Bump `CACHE_VERSION` in `public/sw.js` when
changing shell assets or cache policy; activation removes only old Lumina caches
and immediately claims clients. Registration checks for updates on each load.

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
