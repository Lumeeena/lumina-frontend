# Lumina Frontend

> Next.js explorer UI for [Lumina](https://github.com/Lumeeena/lumina-backend), an open-source event indexer and GraphQL data layer for the Stellar network.

Part of the Lumina project, split across three repos:

- [lumina-frontend](https://github.com/Lumeeena/lumina-frontend) — this repo
- [lumina-backend](https://github.com/Lumeeena/lumina-backend) — indexer + GraphQL API + PostgreSQL schema
- [lumina-contracts](https://github.com/Lumeeena/lumina-contracts) — Soroban Registry contract

## Getting Started

```bash
npm install
npm run dev
```

Runs against `http://localhost:4000/graphql` by default — start [lumina-backend](https://github.com/Lumeeena/lumina-backend)'s GraphQL server first (or point at a deployed one, see below).

### Environment variables

| Variable | Used by | Default |
|---|---|---|
| `GRAPHQL_URL` | Server Components (runtime, not exposed to the browser) | `http://localhost:4000/graphql` |
| `NEXT_PUBLIC_GRAPHQL_URL` | Client-side polling (`LiveFeed`, GraphQL Playground) — **build-time inlined** | `http://localhost:4000/graphql` |

`NEXT_PUBLIC_GRAPHQL_URL` must be set as a Docker build `ARG` (see `Dockerfile`), not a runtime env var — Next.js inlines `NEXT_PUBLIC_*` values into the client bundle at build time, so setting it only at container-run time has no effect.

## Structure

```
app/            App Router pages
components/     React components
lib/            GraphQL client + formatters
```

## License

MIT
