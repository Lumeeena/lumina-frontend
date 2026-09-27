# Environment Variables

This document describes every environment variable the Lumina frontend reads.

## Build-Time Variables (NEXT_PUBLIC_*)

Variables prefixed with `NEXT_PUBLIC_` are **baked into the JavaScript bundle at build time**. Their values are embedded when the build runs, not read from the server's environment at runtime. This is a Next.js feature that allows the browser to access them.

**Deployment constraint**: To change a `NEXT_PUBLIC_` variable, you must **rebuild the application** with the new value. Simply restarting the server or updating the environment variable is not enough — the change won't be visible until a new build is deployed.

### NEXT_PUBLIC_SITE_URL

- **Default**: `http://localhost:3000`
- **Purpose**: The public origin (protocol + domain) of the deployed frontend, used for absolute URLs in sitemaps, canonical links, and social media share images (`og:url`).
- **Must match backend**: No, but it should match the actual deployed URL.
- **Effect**: Used in:
  - Sitemap generation (`app/sitemap.ts`)
  - Metadata builders for canonical links and OG tags
  - Share card images

### NEXT_PUBLIC_GRAPHQL_URL

- **Default**: `http://localhost:4000/graphql`
- **Purpose**: The GraphQL endpoint the browser uses to fetch data. Must be reachable from the user's machine.
- **Must match backend**: Yes — this must point to a running GraphQL server that the frontend can reach.
- **Effect**: All GraphQL queries in the browser use this URL.

### NEXT_PUBLIC_GRAPHQL_WS_URL

- **Default**: Derived from `NEXT_PUBLIC_GRAPHQL_URL` by swapping the scheme (`http://` → `ws://`, `https://` → `wss://`).
- **Purpose**: The WebSocket endpoint for GraphQL subscriptions (live updates). Set this only if the WebSocket server is hosted at a different location than the HTTP GraphQL endpoint.
- **Must match backend**: Yes — this must point to the same GraphQL server's WebSocket handler.
- **Effect**: Live subscriptions (real-time data updates) in components that use `useSubscription()`.

### NEXT_PUBLIC_REGISTRY_CONTRACT_ID

- **Default**: `CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ` (Stellar testnet registry)
- **Purpose**: The Stellar contract ID of the Lumina Registry smart contract, read via Soroban RPC.
- **Must match backend**: Yes — this should be the same contract ID that the backend indexes.
- **Effect**: Used in `lib/registry.ts` to call contract methods like `get_active_profiles`, `get_reputation`, and `get_slashes`.

### NEXT_PUBLIC_SOROBAN_RPC_URL

- **Default**: `https://soroban-testnet.stellar.org`
- **Purpose**: The Soroban RPC endpoint used to read the Registry contract. Must be reachable from the browser.
- **Must match backend**: No, but it should connect to the same Stellar network (mainnet/testnet).
- **Effect**: Used to call Stellar smart contracts and simulate transactions in `lib/registry.ts`.

### NEXT_PUBLIC_NETWORK_PASSPHRASE

- **Default**: `Test SDF Network ; September 2015` (Stellar testnet)
- **Purpose**: The Stellar network identifier. Used when building transactions for contract simulation.
- **Must match backend**: Yes — the frontend and backend must target the same Stellar network.
- **Valid values**:
  - Testnet: `Test SDF Network ; September 2015`
  - Mainnet: `Public Global Stellar Network ; September 2015`
- **Effect**: Used in `lib/registry.ts` to construct and sign transactions for Soroban RPC calls.

### NEXT_PUBLIC_REGISTRY_READ_ACCOUNT

- **Default**: `GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY` (a testnet account)
- **Purpose**: A Stellar account address used for read-only contract simulation. Does not sign or spend anything.
- **Must match backend**: No, any funded account on the target network works.
- **Effect**: Used in `lib/registry.ts` as the source for read-only Soroban RPC transactions.

## Server-Side Variables (Runtime)

Variables without the `NEXT_PUBLIC_` prefix are server-side only — they are read at runtime on the server and are not sent to the browser.

### GRAPHQL_URL

- **Default**: `http://localhost:4000/graphql`
- **Purpose**: The GraphQL endpoint the server uses to fetch data. This reaches the `graphql-server` container over the internal Docker network in development.
- **Must match backend**: Yes — this must point to a running GraphQL server.
- **Effect**: Server-side operations like API routes and server-side rendering use this URL. Unlike `NEXT_PUBLIC_GRAPHQL_URL`, this URL does not need to be reachable from the browser — only from the server.

## Summary by Network

### Development (Localhost)
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_REGISTRY_CONTRACT_ID=CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_REGISTRY_READ_ACCOUNT=GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY
```

### Testnet Deployment
```
NEXT_PUBLIC_SITE_URL=https://testnet.lumina.example.com
NEXT_PUBLIC_GRAPHQL_URL=https://graphql-testnet.example.com/graphql
GRAPHQL_URL=http://graphql-server:4000/graphql (internal Docker network)
NEXT_PUBLIC_REGISTRY_CONTRACT_ID=CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_REGISTRY_READ_ACCOUNT=GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY
```

### Mainnet Deployment
```
NEXT_PUBLIC_SITE_URL=https://lumina.example.com
NEXT_PUBLIC_GRAPHQL_URL=https://graphql.example.com/graphql
GRAPHQL_URL=http://graphql-server:4000/graphql (internal Docker network)
NEXT_PUBLIC_REGISTRY_CONTRACT_ID=[mainnet registry contract ID]
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
NEXT_PUBLIC_REGISTRY_READ_ACCOUNT=[mainnet account]
```
