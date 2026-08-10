// Mirrors graphql-server/src/schema.graphql — camelCase GraphQL shapes, not Horizon's snake_case.

export interface Transaction {
  hash: string;
  ledger: number;
  createdAt: string;
  sourceAccount: string;
  feeCharged: string;
  operationCount: number;
  successful: boolean;
  memoType: string | null;
  memo: string | null;
}

export interface Operation {
  id: string;
  type: string;
  createdAt: string;
  transactionHash: string;
  sourceAccount: string;
  from: string | null;
  to: string | null;
  amount: string | null;
  asset: string | null;
  startingBalance: string | null;
  funder: string | null;
  offerId: string | null;
  price: string | null;
  selling: string | null;
  buying: string | null;
}

export interface Balance {
  assetType: string;
  assetCode: string | null;
  assetIssuer: string | null;
  balance: string;
  limit: string | null;
  buyingLiabilities: string | null;
  sellingLiabilities: string | null;
}

export interface AccountFlags {
  authRequired: boolean;
  authRevocable: boolean;
  authImmutable: boolean;
  authClawbackEnabled: boolean;
}

export interface Account {
  address: string;
  sequence: string;
  subentryCount: number;
  lastModifiedLedger: number;
  numSponsored: number;
  numSponsoring: number;
  balances: Balance[];
  flags: AccountFlags;
  transactions: Transaction[];
  operations: Operation[];
}

export interface ContractEvent {
  id: string;
  type: string;
  contractId: string;
  ledger: number;
  createdAt: string;
  pagingToken: string;
  topics: string[];
  value: string | null;
}

export interface Ledger {
  sequence: number;
  closedAt: string;
  transactionCount: number;
  operationCount: number;
  baseFee: number;
  baseReserve: number;
}
