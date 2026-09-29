// Display models come from actual selection sets, not assumed API responses.
import type {
  TransactionPageQuery,
  AccountOperationsQuery,
  AccountDetailQuery,
  AccountTrustlineOpsQuery,
  OwnerContractEventsQuery,
  LatestLedgerQuery,
  AssetVolumeQuery,
} from "./generated/graphql";

export type Transaction = TransactionPageQuery["transactions"]["items"][number];
export type Operation = AccountOperationsQuery["operations"]["items"][number];
export type TrustlineOp = AccountTrustlineOpsQuery["operations"]["items"][number];
export type Account = NonNullable<AccountDetailQuery["account"]>;
export type Balance = Account["balances"][number];
export type AccountFlags = Account["flags"];
export type ContractEvent = OwnerContractEventsQuery["events"]["items"][number];
export type Ledger = NonNullable<LatestLedgerQuery["latestLedger"]>;

// Asset types - matching the backend schema
export type AssetStats = NonNullable<AssetVolumeQuery["asset"]>;
export type TrustlineChange = TrustlineOp;
export type VolumeBucket = AssetStats["series"][number];
