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
| `NEXT_PUBLIC_REGISTRY_CONTRACT_ID` | Registry + Stats pages, reading the Lumina Registry directly via Soroban RPC | the deployed testnet registry (`CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ`) |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Same | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Same, and the Registry page's wallet-signed transactions | testnet passphrase |
| `NEXT_PUBLIC_REGISTRY_READ_ACCOUNT` | Any funded account used only for read-only simulation (no secret key needed) | a funded testnet account |

`NEXT_PUBLIC_*` values must be set as Docker build `ARG`s (see `Dockerfile`), not runtime env vars — Next.js inlines them into the client bundle at build time, so setting them only at container-run time has no effect.

## Wallet-connected Registry page

`/registry` lets a user register a contract on the Lumina Registry directly from the browser, via [@creit.tech/stellar-wallets-kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) (Freighter, xBull, Albedo, Rabet, and Lobstr are wired in — not locked to a single wallet). Connecting opens a wallet-picker modal; registering builds a `register_contract` invocation with `@stellar/stellar-sdk`, simulates it, has the chosen wallet sign it, and submits it via Soroban RPC. The "Recently Registered" list reads the live registry the same way — no wallet needed for that part.

## Structure

```
app/            App Router pages
components/     React components
lib/            GraphQL client + formatters
```

## License

MIT
