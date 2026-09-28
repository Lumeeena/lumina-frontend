/* eslint-disable */
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Account = {
  address: Scalars['String']['output'];
  balances: Array<Balance>;
  flags: AccountFlags;
  lastModifiedLedger: Scalars['Int']['output'];
  numSponsored: Scalars['Int']['output'];
  numSponsoring: Scalars['Int']['output'];
  operations: Maybe<Array<Operation>>;
  sequence: Scalars['String']['output'];
  subentryCount: Scalars['Int']['output'];
  thresholds: Thresholds;
  /** Related rows are optional so a lookup error does not erase the account. */
  transactions: Maybe<Array<Transaction>>;
};


export type AccountOperationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type AccountTransactionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type AccountFlags = {
  authClawbackEnabled: Scalars['Boolean']['output'];
  authImmutable: Scalars['Boolean']['output'];
  authRequired: Scalars['Boolean']['output'];
  authRevocable: Scalars['Boolean']['output'];
};

/**
 * Everything an asset detail page needs: supply and holders from indexed
 * balances plus a bucketed volume series from operations.
 */
export type AssetDetail = {
  asset: Scalars['String']['output'];
  code: Maybe<Scalars['String']['output']>;
  holders: Scalars['Int']['output'];
  issuer: Maybe<Scalars['String']['output']>;
  native: Scalars['Boolean']['output'];
  series: Array<VolumeBucket>;
  /** Sum of indexed balances, as a decimal string (no float rounding). */
  supply: Scalars['String']['output'];
};

/** One page of assets. Cursor-paginated like every other list in the schema. */
export type AssetPage = {
  items: Array<AssetDetail>;
  pageInfo: PageInfo;
};

/** What a list of assets is ordered by. See the `assets` root field. */
export type AssetSort =
  /** Most-held first — the default, and the useful one for a token list. */
  | 'HOLDERS'
  /** Highest recent transfer volume first. */
  | 'VOLUME';

export type Balance = {
  assetCode: Maybe<Scalars['String']['output']>;
  assetIssuer: Maybe<Scalars['String']['output']>;
  assetType: Scalars['String']['output'];
  balance: Scalars['String']['output'];
  buyingLiabilities: Maybe<Scalars['String']['output']>;
  limit: Maybe<Scalars['String']['output']>;
  sellingLiabilities: Maybe<Scalars['String']['output']>;
};

export type ContractEvent = {
  contractId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  ledger: Scalars['Int']['output'];
  pagingToken: Scalars['String']['output'];
  topics: Array<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  value: Maybe<Scalars['String']['output']>;
};

export type ContractEventPage = {
  items: Array<ContractEvent>;
  pageInfo: PageInfo;
};

export type ContractSchema = {
  contractId: Scalars['String']['output'];
  events: Array<SchemaEvent>;
  version: Scalars['Int']['output'];
};

export type CustomEvent = {
  contractId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  eventId: Scalars['String']['output'];
  eventName: Scalars['String']['output'];
  fields: Array<CustomEventField>;
  ledger: Scalars['Int']['output'];
  schemaVersion: Scalars['Int']['output'];
};

/**
 * A decoded field.
 *
 * `value` is a string regardless of `type`, and deliberately so: the type this
 * feature exists for is i128, which does not fit in a JSON number. Returning a
 * Float would silently round token amounts above 2^53. `type` tells a client how
 * to parse the string exactly.
 */
export type CustomEventField = {
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  value: Maybe<Scalars['String']['output']>;
};

/**
 * One filter clause. `value` is a string for every type — see CustomEventField
 * for why — and is coerced server-side using the type the schema declares.
 */
export type CustomEventFilter = {
  field: Scalars['String']['input'];
  op: FilterOp;
  value: Scalars['String']['input'];
};

export type CustomEventPage = {
  items: Array<CustomEvent>;
  pageInfo: PageInfo;
};

export type FilterOp =
  | 'EQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'NE';

/**
 * How current the indexed data is, for one network.
 *
 * **Advisory.** It is a measurement of lag, not a guarantee: `stale` is derived
 * from Horizon tip read at the moment of the call and a lag threshold, and the
 * numbers move between calls. Use it to render "data is N ledgers behind" or
 * "showing cached data", not as an SLA and not as a gate on showing data at all
 * — stale data with an honest label beats no data.
 *
 * The query is built to answer "how stale?" rather than fail when the indexer
 * is down: the indexed side comes from Postgres, the tip comes from Horizon,
 * and either being unreachable is reported as a field (`null` plus
 * `stale: true`) rather than as an error.
 */
export type IndexerStatus = {
  /** When this status was computed (ISO-8601). */
  checkedAt: Scalars['String']['output'];
  /** Horizon current tip for this network, or null if it could not be read. */
  horizonLedger: Maybe<Scalars['Int']['output']>;
  /** `horizonLedger - latestIndexedLedger`, or null if the tip is unknown. */
  lagLedgers: Maybe<Scalars['Int']['output']>;
  /** When that ledger was indexed (ISO-8601), or null if none yet. */
  latestIndexedAt: Maybe<Scalars['String']['output']>;
  /** Highest ledger sequence indexed for this network, or null if none yet. */
  latestIndexedLedger: Maybe<Scalars['Int']['output']>;
  /** Network these numbers describe. */
  network: Network;
  /**
   * True when the data cannot be assumed current: the tip could not be read, or
   * the indexer is more than a few ledgers behind it.
   */
  stale: Scalars['Boolean']['output'];
};

export type Ledger = {
  baseFee: Scalars['Int']['output'];
  baseReserve: Scalars['Int']['output'];
  closedAt: Scalars['String']['output'];
  operationCount: Scalars['Int']['output'];
  sequence: Scalars['Int']['output'];
  transactionCount: Scalars['Int']['output'];
};

/**
 * Networks this deployment serves.
 *
 * The set is fixed rather than derived from configuration because an enum is
 * part of the API contract: naming a network that is not here has to be a
 * question a client can ask and get a definite answer to, not a string that
 * silently resolves to a different dataset. Declaring a network in `NETWORKS`
 * that this enum does not carry fails at startup — see docs/MULTI_NETWORK.md.
 */
export type Network =
  | 'FUTURENET'
  | 'MAINNET'
  | 'TESTNET';

export type Operation = {
  account: Maybe<Account>;
  amount: Maybe<Scalars['String']['output']>;
  asset: Maybe<Scalars['String']['output']>;
  buying: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  from: Maybe<Scalars['String']['output']>;
  funder: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  offerId: Maybe<Scalars['String']['output']>;
  price: Maybe<Scalars['String']['output']>;
  selling: Maybe<Scalars['String']['output']>;
  sourceAccount: Scalars['String']['output'];
  startingBalance: Maybe<Scalars['String']['output']>;
  to: Maybe<Scalars['String']['output']>;
  transaction: Maybe<Transaction>;
  transactionHash: Scalars['String']['output'];
  type: OperationType;
};

export type OperationPage = {
  items: Array<Operation>;
  pageInfo: PageInfo;
};

export type OperationType =
  | 'ACCOUNT_MERGE'
  | 'ALLOW_TRUST'
  | 'BUMP_SEQUENCE'
  | 'CHANGE_TRUST'
  | 'CREATE_ACCOUNT'
  | 'CREATE_PASSIVE_SELL_OFFER'
  | 'EXTEND_FOOTPRINT_TTL'
  | 'INVOKE_HOST_FUNCTION'
  | 'MANAGE_BUY_OFFER'
  | 'MANAGE_DATA'
  | 'MANAGE_SELL_OFFER'
  | 'PATH_PAYMENT_STRICT_RECEIVE'
  | 'PATH_PAYMENT_STRICT_SEND'
  | 'PAYMENT'
  | 'RESTORE_FOOTPRINT'
  | 'SET_OPTIONS';

export type PageInfo = {
  cursor: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type Query = {
  /** Fetch an account by Stellar address. */
  account: Maybe<Account>;
  /**
   * Asset detail in one call: current supply and holder count plus a bucketed
   * volume series. Supply is the sum of indexed `accounts.balances` for the
   * asset (a last-seen snapshot, not ledger state) — see the query docs for
   * limitations. The series reuses the `operations(asset:)` predicate, so its
   * buckets always agree with the operation list.
   */
  asset: AssetDetail;
  /**
   * Fetch a page of assets, ordered by holder count or transfer volume.
   *
   * Cursor-paginated on the same `PageInfo` as every other list in the schema, so
   * a walk through the assets keeps its place even as newer activity lands. The
   * page is a summary: it carries supply and holder counts, not the per-asset
   * volume series `asset` returns. Clients that want the series ask for it on
   * `asset`, one asset at a time — a list of fifty series is fifty times the
   * aggregation for a column nobody is reading.
   */
  assets: AssetPage;
  /** The custom schema registered for a contract, if any. */
  contractSchema: Maybe<ContractSchema>;
  /**
   * Events decoded against a contract's registered custom schema, with named,
   * typed fields rather than a raw JSON blob.
   */
  customEvents: CustomEventPage;
  /**
   * Fetch Soroban contract events by contract ID.
   * Requires Soroban RPC indexing to be enabled.
   */
  events: ContractEventPage;
  /**
   * How far behind the chain this API data is. Advisory — see IndexerStatus for
   * what it does and does not promise.
   */
  indexerStatus: IndexerStatus;
  /** Get the latest ledger. */
  latestLedger: Maybe<Ledger>;
  /** Get a specific ledger by sequence number. */
  ledger: Maybe<Ledger>;
  /** Fetch operations, optionally filtered by account address and type. */
  operations: OperationPage;
  /**
   * Search transactions by memo, ranked by relevance.
   *
   * Ranking is trigram similarity rather than full-text search: Stellar memos are
   * order references and short codes rather than prose, and stemming an
   * identifier is wrong. An exact case-insensitive match always ranks first.
   */
  search: TransactionPage;
  /** Get a single transaction by hash. */
  transaction: Maybe<Transaction>;
  /** Fetch recent transactions, newest first. */
  transactions: TransactionPage;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryAccountArgs = {
  address: Scalars['String']['input'];
  network?: InputMaybe<Network>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryAssetArgs = {
  asset: Scalars['String']['input'];
  bucketSeconds?: InputMaybe<Scalars['Int']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  network?: InputMaybe<Network>;
  to?: InputMaybe<Scalars['String']['input']>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryAssetsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  network?: InputMaybe<Network>;
  sortBy?: InputMaybe<AssetSort>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryContractSchemaArgs = {
  contractId: Scalars['String']['input'];
  network?: InputMaybe<Network>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryCustomEventsArgs = {
  contractId: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  event: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  network?: InputMaybe<Network>;
  where?: InputMaybe<Array<CustomEventFilter>>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryEventsArgs = {
  contractId: Scalars['String']['input'];
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  network?: InputMaybe<Network>;
  topic?: InputMaybe<Scalars['String']['input']>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryIndexerStatusArgs = {
  network?: InputMaybe<Network>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryLatestLedgerArgs = {
  network?: InputMaybe<Network>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryLedgerArgs = {
  network?: InputMaybe<Network>;
  sequence: Scalars['Int']['input'];
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryOperationsArgs = {
  account?: InputMaybe<Scalars['String']['input']>;
  asset?: InputMaybe<Scalars['String']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  network?: InputMaybe<Network>;
  type?: InputMaybe<OperationType>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QuerySearchArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  network?: InputMaybe<Network>;
  query: Scalars['String']['input'];
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryTransactionArgs = {
  hash: Scalars['String']['input'];
  network?: InputMaybe<Network>;
};


/**
 * Root queries.
 *
 * Every field takes an optional `network` argument:
 *
 * - **Omitted** — the primary network configured for this deployment. That is
 *   exactly the data every client saw before the argument existed, which is why
 *   adding it is additive rather than breaking.
 * - **Named** — that network and only that network. A network the deployment
 *   does not serve is a `BAD_USER_INPUT` error, never a silent fall back to the
 *   primary: "I asked for testnet and got mainnet" is the data-mixing failure
 *   this argument exists to prevent.
 */
export type QueryTransactionsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  network?: InputMaybe<Network>;
};

export type SchemaEvent = {
  fields: Array<SchemaField>;
  name: Scalars['String']['output'];
  topic: Scalars['String']['output'];
};

export type SchemaField = {
  name: Scalars['String']['output'];
  optional: Scalars['Boolean']['output'];
  source: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type Subscription = {
  /** Subscribe to new operations for a specific account. */
  accountActivity: Operation;
  /** Subscribe to new transactions as they are confirmed. */
  newTransaction: Transaction;
};


export type SubscriptionAccountActivityArgs = {
  address: Scalars['String']['input'];
  network?: InputMaybe<Network>;
};


export type SubscriptionNewTransactionArgs = {
  network?: InputMaybe<Network>;
};

export type Thresholds = {
  highThreshold: Scalars['Int']['output'];
  lowThreshold: Scalars['Int']['output'];
  medThreshold: Scalars['Int']['output'];
};

export type Transaction = {
  account: Maybe<Account>;
  createdAt: Scalars['String']['output'];
  feeCharged: Scalars['String']['output'];
  hash: Scalars['String']['output'];
  ledger: Scalars['Int']['output'];
  ledgerData: Maybe<Ledger>;
  memo: Maybe<Scalars['String']['output']>;
  memoType: Maybe<Scalars['String']['output']>;
  operationCount: Scalars['Int']['output'];
  /** Operations may be null when their lookup fails; errors remain local to this field. */
  operations: Maybe<Array<Operation>>;
  sourceAccount: Scalars['String']['output'];
  successful: Scalars['Boolean']['output'];
};

export type TransactionPage = {
  items: Array<Transaction>;
  pageInfo: PageInfo;
};

/** One bucket of the volume series. Empty buckets report zero volume. */
export type VolumeBucket = {
  bucketEnd: Scalars['String']['output'];
  bucketStart: Scalars['String']['output'];
  operationCount: Scalars['Int']['output'];
  /** Summed transfer amounts in the bucket, as a decimal string. */
  volume: Scalars['String']['output'];
};

export type LatestLedgerQueryVariables = Exact<{ [key: string]: never; }>;


export type LatestLedgerQuery = { latestLedger: { sequence: number, closedAt: string, transactionCount: number, operationCount: number } | null };

export type AccountDetailQueryVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type AccountDetailQuery = { account: { address: string, sequence: string, subentryCount: number, lastModifiedLedger: number, numSponsored: number, numSponsoring: number, balances: Array<{ assetType: string, assetCode: string | null, assetIssuer: string | null, balance: string, limit: string | null }>, flags: { authRequired: boolean, authRevocable: boolean, authImmutable: boolean, authClawbackEnabled: boolean }, transactions: Array<{ hash: string, ledger: number, createdAt: string, sourceAccount: string, feeCharged: string, operationCount: number, successful: boolean, memoType: string | null, memo: string | null }> | null, operations: Array<{ id: string, type: OperationType, createdAt: string, transactionHash: string, sourceAccount: string, from: string | null, to: string | null, amount: string | null, asset: string | null, startingBalance: string | null, funder: string | null, offerId: string | null, price: string | null, selling: string | null, buying: string | null }> | null } | null };

export type ContractEventsQueryVariables = Exact<{
  contractId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type ContractEventsQuery = { events: { items: Array<{ id: string, type: string, contractId: string, ledger: number, createdAt: string, pagingToken: string, topics: Array<string>, value: string | null }>, pageInfo: { hasNextPage: boolean, cursor: string | null } } };

export type StatsQueryVariables = Exact<{
  opLimit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type StatsQuery = { latestLedger: { sequence: number, transactionCount: number } | null, operations: { items: Array<{ type: OperationType }> } };

export type TransactionPageQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type TransactionPageQuery = { transactions: { items: Array<{ hash: string, ledger: number, createdAt: string, sourceAccount: string, feeCharged: string, operationCount: number, successful: boolean, memoType: string | null, memo: string | null }>, pageInfo: { hasNextPage: boolean, cursor: string | null } } };

export type MemoSearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type MemoSearchQuery = { search: { items: Array<{ hash: string, ledger: number, createdAt: string, sourceAccount: string, feeCharged: string, operationCount: number, successful: boolean, memoType: string | null, memo: string | null }> } };

export type TransactionDetailQueryVariables = Exact<{
  hash: Scalars['String']['input'];
}>;


export type TransactionDetailQuery = { transaction: { hash: string, ledger: number, createdAt: string, sourceAccount: string, feeCharged: string, operationCount: number, successful: boolean, memoType: string | null, memo: string | null, operations: Array<{ id: string, type: OperationType, createdAt: string, sourceAccount: string, from: string | null, to: string | null, amount: string | null, asset: string | null }> | null } | null };

export type OwnerContractEventsQueryVariables = Exact<{
  contractId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type OwnerContractEventsQuery = { events: { items: Array<{ id: string, type: string, contractId: string, ledger: number, createdAt: string, pagingToken: string, topics: Array<string>, value: string | null }> } };

export type AccountOperationsQueryVariables = Exact<{
  address: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AccountOperationsQuery = { operations: { items: Array<{ id: string, type: OperationType, createdAt: string, transactionHash: string, sourceAccount: string, from: string | null, to: string | null, amount: string | null, asset: string | null, startingBalance: string | null, funder: string | null, offerId: string | null, price: string | null, selling: string | null, buying: string | null }>, pageInfo: { hasNextPage: boolean, cursor: string | null } } };

export type LiveFeedTransactionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LiveFeedTransactionsQuery = { transactions: { items: Array<{ hash: string, ledger: number, createdAt: string, sourceAccount: string, feeCharged: string, operationCount: number, successful: boolean, memoType: string | null, memo: string | null }> } };

export type LiveFeedNewTransactionSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type LiveFeedNewTransactionSubscription = { newTransaction: { hash: string, ledger: number, createdAt: string, sourceAccount: string, feeCharged: string, operationCount: number, successful: boolean, memoType: string | null, memo: string | null } };

export type AccountTransactionsQueryVariables = Exact<{
  address: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AccountTransactionsQuery = { account: { transactions: Array<{ hash: string, ledger: number, createdAt: string, sourceAccount: string, operationCount: number, feeCharged: string, successful: boolean, memoType: string | null, memo: string | null }> | null } | null };

export type AccountActivitySubscriptionVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type AccountActivitySubscription = { accountActivity: { id: string, type: OperationType, createdAt: string, transactionHash: string, sourceAccount: string, from: string | null, to: string | null, amount: string | null, asset: string | null, startingBalance: string | null, funder: string | null, offerId: string | null, price: string | null, selling: string | null, buying: string | null } };

export type AssetsQueryVariables = Exact<{
  sortBy?: InputMaybe<AssetSort>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AssetsQuery = { assets: { items: Array<{ asset: string, code: string | null, issuer: string | null, native: boolean, supply: string, holders: number }>, pageInfo: { hasNextPage: boolean, cursor: string | null } } };

export type RecentTransactionsQueryVariables = Exact<{ [key: string]: never; }>;


export type RecentTransactionsQuery = { transactions: { items: Array<{ hash: string, ledger: number, createdAt: string, sourceAccount: string, operationCount: number, successful: boolean, feeCharged: string }> } };

export type AccountBalancesQueryVariables = Exact<{ [key: string]: never; }>;


export type AccountBalancesQuery = { account: { address: string, sequence: string, subentryCount: number, balances: Array<{ assetType: string, assetCode: string | null, balance: string, limit: string | null }> } | null };

export type PaymentHistoryQueryVariables = Exact<{ [key: string]: never; }>;


export type PaymentHistoryQuery = { operations: { items: Array<{ id: string, type: OperationType, createdAt: string, from: string | null, to: string | null, amount: string | null, asset: string | null }> } };

export type ExampleContractEventsQueryVariables = Exact<{ [key: string]: never; }>;


export type ExampleContractEventsQuery = { events: { items: Array<{ id: string, type: string, contractId: string, ledger: number, createdAt: string, topics: Array<string>, value: string | null }> } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const LatestLedgerDocument = new TypedDocumentString(`
    query LatestLedger {
  latestLedger {
    sequence
    closedAt
    transactionCount
    operationCount
  }
}
    `) as unknown as TypedDocumentString<LatestLedgerQuery, LatestLedgerQueryVariables>;
export const AccountDetailDocument = new TypedDocumentString(`
    query AccountDetail($address: String!) {
  account(address: $address) {
    address
    sequence
    subentryCount
    lastModifiedLedger
    numSponsored
    numSponsoring
    balances {
      assetType
      assetCode
      assetIssuer
      balance
      limit
    }
    flags {
      authRequired
      authRevocable
      authImmutable
      authClawbackEnabled
    }
    transactions(limit: 10) {
      hash
      ledger
      createdAt
      sourceAccount
      feeCharged
      operationCount
      successful
      memoType
      memo
    }
    operations(limit: 10) {
      id
      type
      createdAt
      transactionHash
      sourceAccount
      from
      to
      amount
      asset
      startingBalance
      funder
      offerId
      price
      selling
      buying
    }
  }
}
    `) as unknown as TypedDocumentString<AccountDetailQuery, AccountDetailQueryVariables>;
export const ContractEventsDocument = new TypedDocumentString(`
    query ContractEvents($contractId: String!, $limit: Int, $cursor: String) {
  events(contractId: $contractId, limit: $limit, cursor: $cursor) {
    items {
      id
      type
      contractId
      ledger
      createdAt
      pagingToken
      topics
      value
    }
    pageInfo {
      hasNextPage
      cursor
    }
  }
}
    `) as unknown as TypedDocumentString<ContractEventsQuery, ContractEventsQueryVariables>;
export const StatsDocument = new TypedDocumentString(`
    query Stats($opLimit: Int) {
  latestLedger {
    sequence
    transactionCount
  }
  operations(limit: $opLimit) {
    items {
      type
    }
  }
}
    `) as unknown as TypedDocumentString<StatsQuery, StatsQueryVariables>;
export const TransactionPageDocument = new TypedDocumentString(`
    query TransactionPage($limit: Int, $cursor: String) {
  transactions(limit: $limit, cursor: $cursor) {
    items {
      hash
      ledger
      createdAt
      sourceAccount
      feeCharged
      operationCount
      successful
      memoType
      memo
    }
    pageInfo {
      hasNextPage
      cursor
    }
  }
}
    `) as unknown as TypedDocumentString<TransactionPageQuery, TransactionPageQueryVariables>;
export const MemoSearchDocument = new TypedDocumentString(`
    query MemoSearch($query: String!) {
  search(query: $query, limit: 20) {
    items {
      hash
      ledger
      createdAt
      sourceAccount
      feeCharged
      operationCount
      successful
      memoType
      memo
    }
  }
}
    `) as unknown as TypedDocumentString<MemoSearchQuery, MemoSearchQueryVariables>;
export const TransactionDetailDocument = new TypedDocumentString(`
    query TransactionDetail($hash: String!) {
  transaction(hash: $hash) {
    hash
    ledger
    createdAt
    sourceAccount
    feeCharged
    operationCount
    successful
    memoType
    memo
    operations {
      id
      type
      createdAt
      sourceAccount
      from
      to
      amount
      asset
    }
  }
}
    `) as unknown as TypedDocumentString<TransactionDetailQuery, TransactionDetailQueryVariables>;
export const OwnerContractEventsDocument = new TypedDocumentString(`
    query OwnerContractEvents($contractId: String!, $limit: Int) {
  events(contractId: $contractId, limit: $limit) {
    items {
      id
      type
      contractId
      ledger
      createdAt
      pagingToken
      topics
      value
    }
  }
}
    `) as unknown as TypedDocumentString<OwnerContractEventsQuery, OwnerContractEventsQueryVariables>;
export const AccountOperationsDocument = new TypedDocumentString(`
    query AccountOperations($address: String!, $limit: Int, $cursor: String) {
  operations(account: $address, limit: $limit, cursor: $cursor) {
    items {
      id
      type
      createdAt
      transactionHash
      sourceAccount
      from
      to
      amount
      asset
      startingBalance
      funder
      offerId
      price
      selling
      buying
    }
    pageInfo {
      hasNextPage
      cursor
    }
  }
}
    `) as unknown as TypedDocumentString<AccountOperationsQuery, AccountOperationsQueryVariables>;
export const LiveFeedTransactionsDocument = new TypedDocumentString(`
    query LiveFeedTransactions($limit: Int) {
  transactions(limit: $limit) {
    items {
      hash
      ledger
      createdAt
      sourceAccount
      feeCharged
      operationCount
      successful
      memoType
      memo
    }
  }
}
    `) as unknown as TypedDocumentString<LiveFeedTransactionsQuery, LiveFeedTransactionsQueryVariables>;
export const LiveFeedNewTransactionDocument = new TypedDocumentString(`
    subscription LiveFeedNewTransaction {
  newTransaction {
    hash
    ledger
    createdAt
    sourceAccount
    feeCharged
    operationCount
    successful
    memoType
    memo
  }
}
    `) as unknown as TypedDocumentString<LiveFeedNewTransactionSubscription, LiveFeedNewTransactionSubscriptionVariables>;
export const AccountTransactionsDocument = new TypedDocumentString(`
    query AccountTransactions($address: String!, $limit: Int) {
  account(address: $address) {
    transactions(limit: $limit) {
      hash
      ledger
      createdAt
      sourceAccount
      operationCount
      feeCharged
      successful
      memoType
      memo
    }
  }
}
    `) as unknown as TypedDocumentString<AccountTransactionsQuery, AccountTransactionsQueryVariables>;
export const AccountActivityDocument = new TypedDocumentString(`
    subscription AccountActivity($address: String!) {
  accountActivity(address: $address) {
    id
    type
    createdAt
    transactionHash
    sourceAccount
    from
    to
    amount
    asset
    startingBalance
    funder
    offerId
    price
    selling
    buying
  }
}
    `) as unknown as TypedDocumentString<AccountActivitySubscription, AccountActivitySubscriptionVariables>;
export const AssetsDocument = new TypedDocumentString(`
    query Assets($sortBy: AssetSort, $limit: Int, $cursor: String) {
  assets(sortBy: $sortBy, limit: $limit, cursor: $cursor) {
    items {
      asset
      code
      issuer
      native
      supply
      holders
    }
    pageInfo {
      hasNextPage
      cursor
    }
  }
}
    `) as unknown as TypedDocumentString<AssetsQuery, AssetsQueryVariables>;
export const RecentTransactionsDocument = new TypedDocumentString(`
    query RecentTransactions {
  transactions(limit: 5) {
    items {
      hash
      ledger
      createdAt
      sourceAccount
      operationCount
      successful
      feeCharged
    }
  }
}
    `) as unknown as TypedDocumentString<RecentTransactionsQuery, RecentTransactionsQueryVariables>;
export const AccountBalancesDocument = new TypedDocumentString(`
    query AccountBalances {
  account(address: "GABC...EXAMPLE") {
    address
    sequence
    subentryCount
    balances {
      assetType
      assetCode
      balance
      limit
    }
  }
}
    `) as unknown as TypedDocumentString<AccountBalancesQuery, AccountBalancesQueryVariables>;
export const PaymentHistoryDocument = new TypedDocumentString(`
    query PaymentHistory {
  operations(account: "GABC...EXAMPLE", type: PAYMENT, limit: 10) {
    items {
      id
      type
      createdAt
      from
      to
      amount
      asset
    }
  }
}
    `) as unknown as TypedDocumentString<PaymentHistoryQuery, PaymentHistoryQueryVariables>;
export const ExampleContractEventsDocument = new TypedDocumentString(`
    query ExampleContractEvents {
  events(contractId: "CABC...EXAMPLE", limit: 10) {
    items {
      id
      type
      contractId
      ledger
      createdAt
      topics
      value
    }
  }
}
    `) as unknown as TypedDocumentString<ExampleContractEventsQuery, ExampleContractEventsQueryVariables>;

export type AssetVolumeQueryVariables = Exact<{
  asset: Scalars['String']['input'];
  from?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
  bucketSeconds?: InputMaybe<Scalars['Int']['input']>;
}>;

export type AssetVolumeQuery = {
  asset: {
    asset: string;
    code: string | null;
    native: boolean;
    series: Array<{
      bucketStart: string;
      volume: string;
      operationCount: number;
    }>;
  };
};

export const AssetVolumeDocument = new TypedDocumentString(`
    query AssetVolume($asset: String!, $from: String, $to: String, $bucketSeconds: Int) {
  asset(asset: $asset, from: $from, to: $to, bucketSeconds: $bucketSeconds) {
    asset
    code
    native
    series {
      bucketStart
      volume
      operationCount
    }
  }
}
    `) as unknown as TypedDocumentString<AssetVolumeQuery, AssetVolumeQueryVariables>;

export type AccountTrustlineOpsQueryVariables = Exact<{
  address: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;

export type AccountTrustlineOpsQuery = { operations: { items: Array<{ id: string, type: OperationType, createdAt: string, transactionHash: string, sourceAccount: string, asset: string | null, amount: string | null }>, pageInfo: { hasNextPage: boolean, cursor: string | null } } };

export const AccountTrustlineOpsDocument = new TypedDocumentString(`
    query AccountTrustlineOps($address: String!, $limit: Int, $cursor: String) {
  operations(account: $address, type: CHANGE_TRUST, limit: $limit, cursor: $cursor) {
    items {
      id
      type
      createdAt
      transactionHash
      sourceAccount
      asset
      amount
    }
    pageInfo {
      hasNextPage
      cursor
    }
  }
}
    `) as unknown as TypedDocumentString<AccountTrustlineOpsQuery, AccountTrustlineOpsQueryVariables>;
