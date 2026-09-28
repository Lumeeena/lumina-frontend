# Contributing

How to set the project up, where new code belongs, and what a pull request is
expected to contain. Two companion documents are referenced rather than
duplicated below: [TESTING.md](TESTING.md) for the test suite and
[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) for every
environment variable, its default and what it affects.

## Getting set up

Install a supported Node.js LTS version (Node 22 recommended; CI runs Node 20),
then run `npm ci` to install exactly what `package-lock.json` pins.

The app reads everything through a GraphQL API. `npm run dev` serves
`http://localhost:3000` and reads `http://localhost:4000/graphql` by default, so
[lumina-backend](https://github.com/Lumeeena/lumina-backend) needs to be running
for data to appear. Point `GRAPHQL_URL` and `NEXT_PUBLIC_GRAPHQL_URL` at a
deployed backend instead if you would rather not run one. Without a backend the
pages still render and navigate, which is enough for pure UI work.

```bash
npm ci        # install, and install the git hooks
npm run dev   # http://localhost:3000
npm run codegen   # after touching graphql/operations.graphql
```

`NEXT_PUBLIC_*` variables are inlined into the browser bundle at build time, so
changing one means restarting the dev server (and rebuilding a deployment).
[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) spells out which
variables are read at runtime and which are baked in.

## Repository layout

```
app/          App Router routes, layouts and route-level metadata
components/   React components
lib/          GraphQL client, subscriptions, wallet, Soroban, formatters
graphql/      operations.graphql and the pinned backend schema
e2e/          Playwright specs
docs/         environment variables, virtualizer/compiler notes
```

Where a new piece of code belongs:

- **A page or route** — `app/<route>/page.tsx`. Add a `RouteInfo` entry to
  `lib/routes.ts` as well; the navbar, `sitemap.ts`, `robots.txt` and per-route
  metadata all read from that one inventory.
- **A query or subscription** — `graphql/operations.graphql`, then
  `npm run codegen` and import the generated document.
- **Pure logic** — `lib/`, with the test beside it. Formatters, filters,
  address handling and the transaction state machine all live here.
- **Interactivity** — a component in `components/`. Add `"use client"` only when
  the file needs state, effects, event handlers or browser APIs; a component that
  only renders props stays a server component.
- **A shared data shape** — `lib/types.ts`.

The dividing line worth keeping: no React imports in `lib/`, and no fetching,
formatting or contract logic inside components. Both rules are what let the unit
suite cover the interesting branches without a DOM, a network or a wallet.

## Code conventions

- **TypeScript** throughout, imported through the `@/` alias
  (`@/lib/formatters`); sibling components are imported relatively (`./TimeAgo`).
- **Formatting is Prettier's defaults** and linting is `eslint-config-next` plus
  the project's own rules; run `npm run lint` before pushing. The pre-commit hook
  treats warnings as failures.
- **Colors come from Tailwind utilities**, not raw hex values. There is an
  ESLint rule (`custom/no-raw-hex-colors`) that fails a build for a hex literal
  in `app/` or `components/`; the global values belong in `app/globals.css`.
- **Generated files are generated.** `lib/generated/graphql.ts` is written by
  `npm run codegen` and CI fails if it drifts from the operations.
- **Comments explain why.** A non-obvious cap, ordering or fallback gets one line
  saying what would break otherwise; the code already says what it does.

## Staged-file checks

`npm ci` installs the Husky pre-commit hook in a local Git checkout. Before a
commit, `lint-staged` runs ESLint (including fixes, with warnings treated as
failures), then Prettier on staged JavaScript/TypeScript files. Prettier also
formats staged JSON, Markdown, CSS, YAML and GraphQL files. It automatically
stages fixes and preserves unstaged portions of partially staged files. Generated
files and build outputs are ignored by the respective tools. No build, test
suite, or project-wide lint runs in the hook. A one-file local check measured
about 2.7 seconds, including ESLint startup.

Run the same checks manually with `npm run lint:staged`. For an intentional
one-off bypass, use `HUSKY=0 git commit -m "reason"` and explain the reason in your
PR. CI and production-only installs do not install local hooks.

## GraphQL schema and generated types

`graphql/schema.graphql` is the unmodified backend schema pinned to
[Lumeeena/lumina-backend at 374d3d6](https://github.com/Lumeeena/lumina-backend/blob/374d3d6b96272319c014ca19c35a719f1fea93cb/graphql-server/src/schema.graphql).
The snapshot makes builds reproducible without a running API. When upgrading the
backend, replace it with that deployment's schema and record the new source
revision here. To validate against a local schema or introspection endpoint
instead, run `GRAPHQL_SCHEMA=/path/to/schema.graphql npm run codegen` (a URL also
works). The committed snapshot cannot detect a remote schema change until it is
updated; backend/frontend upgrades must update it together.

Edit `graphql/operations.graphql` for application queries/subscriptions. Playground
examples in `lib/queries.ts` are also validated. Import generated documents directly
from `lib/generated/graphql.ts`, so unused documents can be tree-shaken. `gqlFetch`
and `useSubscription` infer results and variables from those documents; do not
supply handwritten response type arguments. The playground's user-edited text
remains dynamic and is validated by the API when executed.

Run `npm run codegen` and commit `lib/generated/` alongside operation/schema edits.
`npm run build` runs generation first and fails on invalid fields, arguments or
selections. CI also checks generated files for drift after building. Generated
typed strings keep a GraphQL parser out of the browser bundle.

## Testing

`npm test` is the suite to run while working; [TESTING.md](TESTING.md) covers the
commands, which environment a given test needs, the patterns that make code
testable, and the traps (`vi.mock` hoisting, jsdom, fake timers) that cost time
when rediscovered.

CI runs `npm run test:coverage`, and `vitest.config.ts` gates lines, functions,
branches and statements at 90%. New code is expected to carry the tests that keep
that gate honest — if a change adds an uncovered branch, the coverage job fails.
`npm run test:e2e` runs the Playwright suite against a production build.

## Bundle report

### Investigating a heavy route

Run `npm run analyze`. This validates GraphQL operations and makes a production
Webpack build with `@next/bundle-analyzer`, writing interactive treemaps to
`.next/analyze/client.html`, `.next/analyze/nodejs.html` and (when present)
`.next/analyze/edge.html`. Open these files in a browser; the command does not
launch one, so it also works in CI and headless terminals.

Use the client report to inspect the JavaScript sent to browsers. Compare parsed
and gzip sizes, and search for packages such as the Stellar SDK or wallet kit.
Server report totals are not browser download sizes. Reports are ignored build
artifacts and are regenerated each run. Normal builds keep Next.js's default
Turbopack bundler; the analyzer explicitly selects Webpack, so do not treat its
chunk sizes as the budget below.

### The budget

`bundle-budget.json` records how much first-load JavaScript each route may
ship. A route's size is the chunks its client-reference manifest lists as
synchronous plus the shared Next runtime, gzipped — polyfills are left out
because Next serves them with `noModule`, so no current browser downloads them.
Route handlers are excluded; they have no browser bundle.

`scripts/bundle-report.mjs` measures that from the build in `.next` and
compares it with the budget:

- `npm run bundle:report` prints the per-route table with size, delta and
  budget, writes `.next/bundle-report.json` (the chunk list per route is what
  makes a diff say what moved), and exits non-zero when a route is over budget
  or has no entry at all.
- `npm run bundle:update` rebuilds in compile mode and rewrites
  `bundle-budget.json` to the sizes that build produced. Committing that diff is
  how a raise is accepted; it is meant to be as visible as any other line of
  the pull request.
- `npm run build:bundle` is a compile-only Next build: it skips type checking
  and prerendering, neither of which changes which chunks a route loads. Run it
  before `bundle:report` when you have no build yet; `bundle:update` runs it for
  you, and CI uses it so the budget still reports sizes while the build job is
  red for unrelated reasons.

CI runs `npm run bundle:report` in the **Bundle Budget** job on every push and
pull request, appends the same table to the workflow summary and uploads the
JSON report. A route that is over budget fails the job and annotates the pull
request with the overage; a route with no budget entry fails too, so a new page
cannot ship unsized.

The budget for a route is its last accepted size plus 5 kB of headroom
(`headroomBytes` in the file). That absorbs byte-level churn — a zlib or
Next.js bump moves gzip sizes slightly — while a new dependency is still far
beyond it.

This, with the analyzer above, closes [bundle budget issue
#34](https://github.com/Lumeeena/lumina-frontend/issues/34).

## Translation

User-facing strings are in `lib/i18n/en.ts`. See
[docs/TRANSLATION.md](docs/TRANSLATION.md) for how to add a language, the
catalogue format (interpolation, pluralisation), and what to test.

## Virtualizer and React Compiler

See [docs/virtualizer-compiler.md](docs/virtualizer-compiler.md) for the isolated
compiler boundary, reproducible measurement and its limitations.

## Pull requests

A pull request is one concern, with a diff a reviewer can hold in their head.
Unrelated tidying, reformatting or dependency bumps belong in their own PR
because they double the diff without doubling the review's value.

- **Title** — a conventional prefix and an imperative summary. Use `fix:` for
  corrections, `feat:` for new behaviour, and `docs:`/`chore:` for the rest:
  - `feat: virtualize the account transaction list`
  - `fix: keep the live feed reconnect backoff jittered`
  - `docs: document the environment variables`
- **Body** — what changed and why, then how it was verified. Name the commands
  you ran (`npm test`, `npm run build`, a manual path through the UI) and what
  you observed; a screenshot or short recording for anything visual. State the
  limitation if you could not verify something rather than leaving it implied.
- **Link the issue** — reference it in the body and end with `Closes #<number>`
  so merging closes it.
- **Keep CI green** — build, unit tests with coverage, the Playwright suites
  and the bundle budget run on every pull request, along with the
  generated-files drift check. A route over budget needs shrinking or an
  explicit `npm run bundle:update` (see [Bundle report](#bundle-report)).
- **Include the tests** — see [Testing](#testing); a behaviour change without a
  test that would fail without the change is usually incomplete, and a bug fix is
  best accompanied by the test that reproduces it.
- **Update the docs in the same PR** when you add a route, an environment
  variable or a user-visible behaviour. The README, this guide and
  [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) are part of the
  deliverable.
- **Do not hand-edit generated files** — change the operation or schema and
  re-run `npm run codegen`.
