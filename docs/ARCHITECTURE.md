# Lumina Frontend Architecture

This is the Next.js App Router UI for [Lumina](../README.md), the Stellar indexer
and GraphQL API in [lumina-backend](https://github.com/Lumeeena/lumina-backend).
It reads every piece of network data through that GraphQL API and writes to
Soroban contracts directly from the browser when a wallet is connected.

The point of this document is placement: which component renders where, where a
new fetch belongs, and how the wallet and transaction paths are wired, so the
next change does not have to re-derive it.

## Runtime shape

The app runs in two places at once:

- **Server components** render on the Node server. They own page metadata and
  the first read of a page's data, and they talk to the backend over the
  internal URL (`GRAPHQL_URL`).
- **Client components** (`"use client"`) own interactivity: subscriptions,
  polling, filters, the wallet and contract writes. They talk to the backend
  over `NEXT_PUBLIC_GRAPHQL_URL`, which Next inlines into the bundle at build
  time.

`next.config.ts` enables the React Compiler in `annotation` mode, so memoization
is opt-in per component rather than repo-wide. See
[`virtualizer-compiler.md`](./virtualizer-compiler.md) for the measurement and
its limits.

## Server and client components

Pages under `app/` are server components unless a file opts out with
`"use client"`. A page stays on the server when it can:

- `app/accounts/[address]/page.tsx` fetches the account with `gqlFetch` against
  `GRAPHQL_URL` and is marked `dynamic = "force-dynamic"` so the data is not
  cached.
- Its `generateMetadata` deliberately does **not** wait on GraphQL. A share card
  is requested by bots that do not retry, so the title and the OpenGraph image
  are built from the address in the URL alone.

Components opt into the client only for state, effects or browser APIs:

- `components/LiveFeed.tsx` — subscriptions, a capped in-memory list, pause and
  resume.
- `app/registry/page.tsx` — wallet connection and contract writes, with the
  active category filter read from the URL.
- `app/graphql/page.tsx` — the playground, driven by user-edited text.
- The account activity, transaction and operation feeds — polling and
  "load more" interactions.

When a page needs both, the server component renders the static shell and
metadata, and a client component (often inside a `Suspense` boundary, because
`useSearchParams` needs one) renders the interactive part. `app/explorer/page.tsx`
is the clearest example: the heading and search bar render on the server, while
`TransactionExplorer` is a client child.

## Data fetching patterns

There are exactly three ways this app reads data, and the choice is not
free-form:

1. **Server render reads** — `gqlFetch` with `GRAPHQL_URL`, inside a server
   component. Use this for the content a crawler or a first paint needs. The
   document is a generated `TypedDocumentString`, so the response type is
   inferred; do not hand-write response types.
2. **Browser reads** — `gqlFetch` with `PUBLIC_GRAPHQL_URL`, inside a client
   component. Use this for interaction-driven reads: the seed page of the live
   feed, polling fallbacks, and the playground.
3. **Subscriptions** — `lib/useSubscription` over the socket in
   `lib/subscriptions.ts`. Use this when the server can push (the home
   `LiveFeed` and the account Live Activity panel).

`lib/subscriptions.ts` speaks the `graphql-transport-ws` protocol directly over
a `WebSocket` instead of pulling in a client library, and one socket is shared
by the whole tab. Drops reconnect with exponential backoff and full jitter, and
active subscriptions are replayed on the new socket because the server has no
memory of the previous one. After the retry budget is exhausted — or where
`WebSocket` is unavailable — the consumer falls back to polling rather than
going dead.

Filters, search and pagination live in the URL (`?status=`, `?contractId=`,
`?q=`, cursor arguments), never in component state alone. A filtered view is the
same page as the route it filters and declares that route as its canonical, so a
shared link reproduces what the sender saw.

## How `lib/` relates to components

Components render; `lib/` decides how data is fetched, validated and shaped.
The notable modules:

- `lib/generated/` — the GraphQL Code Generator output. Import documents from
  here directly so unused ones can be tree-shaken; regenerate with
  `npm run codegen` and never edit by hand.
- `lib/graphql.ts` — the `gqlFetch` wrapper plus the two base URLs
  (`GRAPHQL_URL` server-side, `PUBLIC_GRAPHQL_URL` in the browser).
- `lib/useSubscription.ts` / `lib/subscriptions.ts` — the React binding and the
  socket protocol behind it.
- `lib/queries.ts` — the playground's worked examples. They use literal
  arguments so "Run Query" needs no separate variables panel.
- `lib/routes.ts` — the single route inventory. The nav, `app/sitemap.ts`,
  `robots.txt` and per-route metadata all read from it, so adding a route is one
  entry rather than four edits that drift.
- `lib/metadata.ts` — `routeMetadata` and the generated OpenGraph images.
- `lib/formatters.ts` — display helpers (`formatXLM`, `truncateAddress`, …).
- `lib/registry.ts`, `lib/wallet.ts`, `lib/sorobanTx.ts` — the on-chain read and
  write path described below.
- `lib/types.ts` — the result types shared across pages and components.

The rule of thumb: if it can be decided without React, it belongs in `lib/` and
gets a unit test next to it. That is what keeps the wallet and transaction logic
testable without a browser extension.

## Wallet and transaction architecture

`lib/wallet.ts` wraps `@creit.tech/stellar-wallets-kit` behind a small session
API: connect, disconnect, `getConnectedWallet`, and `readPersistedSession`,
which seeds the UI from `localStorage` so a reload does not flash a disconnected
state before the async check resolves.

`lib/sorobanTx.ts` is the write path, modelled as an explicit phase machine:

    building -> awaiting-signature -> submitting -> confirming -> success | error

`submitContractCall` walks those phases, reports each through `onPhase` so the
UI can render an honest button label, and throws a `ContractCallError` tagged
with the phase it failed in — "signature declined" reads differently from
"network rejected" and the phase is what makes that possible. It resolves only
once the network reports `SUCCESS`; a transaction that never settles within
`maxPolls` is a failure, because claiming success on a maybe is worse than
asking the user to check back.

The pipeline depends on the narrow `ContractCallDriver` interface (`prepare`,
`send`, `status`) rather than on `@stellar/stellar-sdk` directly.
`createStellarDriver` is the production implementation; tests inject a fake and
exercise every branch, including the ones that only happen when the network
misbehaves.

`app/registry/page.tsx` composes both: it reads the live registry without a
wallet (the list is a plain contract read), and only asks for a connection when
the user wants to register or deactivate a contract.

## Rendering and performance

Long lists are virtualized with `@tanstack/react-virtual`. The live feed caps
its length (`MAX_FEED_LENGTH`) because a subscription-backed list would
otherwise grow without bound on a tab left open overnight; it is a "what is
happening now" panel, not scrollback. React Compiler memoization is enabled per
component via an annotation, and the boundary is measured rather than assumed.

## Where new code goes

- **New page** — add a `RouteInfo` to `lib/routes.ts`, then a server component
  that reads through `gqlFetch(GRAPHQL_URL, …)` and exports metadata built with
  `routeMetadata`.
- **New query** — add it to `graphql/operations.graphql`, run `npm run codegen`,
  import the generated document, and let the types flow from there.
- **New interaction** — a `"use client"` component under `components/`, with the
  data shape in `lib/types.ts` and any non-React logic extracted to `lib/`.
- **New on-chain write** — extend `ContractCallDriver` if the RPC surface grew,
  and drive it through `submitContractCall`; keep it framework-free so the fake
  driver keeps covering it.
