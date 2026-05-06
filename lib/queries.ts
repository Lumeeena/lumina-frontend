export interface QueryExample {
  name: string;
  description: string;
  query: string;
  mockResult: object;
}

export const QUERY_EXAMPLES: QueryExample[] = [
  {
    name: "Recent Transactions",
    description: "Fetch the last 5 transactions on the network",
    query: `query RecentTransactions {
  transactions(limit: 5, order: DESC) {
    hash
    ledger
    createdAt
    sourceAccount
    operationCount
    successful
    feeCharged
  }
}`,
    mockResult: {
      transactions: [
        { hash: "a3f2e1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2", ledger: 52481234, createdAt: "2026-05-06T10:22:14Z", sourceAccount: "GABC...1234", operationCount: 1, successful: true, feeCharged: "100" },
        { hash: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5", ledger: 52481233, createdAt: "2026-05-06T10:22:09Z", sourceAccount: "GDEF...5678", operationCount: 2, successful: true, feeCharged: "200" },
        { hash: "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", ledger: 52481232, createdAt: "2026-05-06T10:22:01Z", sourceAccount: "GHIJ...9012", operationCount: 1, successful: false, feeCharged: "100" },
      ],
    },
  },
  {
    name: "Account Balances",
    description: "Get all asset balances for an account",
    query: `query AccountBalances($address: String!) {
  account(address: $address) {
    address
    sequence
    subentryCount
    balances {
      asset
      balance
      limit
    }
  }
}`,
    mockResult: {
      account: {
        address: "GABC...1234",
        sequence: "192837465019283746",
        subentryCount: 3,
        balances: [
          { asset: "XLM", balance: "1234.5678901", limit: null },
          { asset: "USDC:GA5ZSE...KZVN", balance: "500.0000000", limit: "10000.0000000" },
          { asset: "AQUA:GBNZIL...AQUA", balance: "12000.0000000", limit: "100000.0000000" },
        ],
      },
    },
  },
  {
    name: "Payment History",
    description: "Fetch payment operations for an account",
    query: `query PaymentHistory($address: String!, $limit: Int) {
  operations(
    account: $address
    type: PAYMENT
    limit: $limit
  ) {
    id
    type
    createdAt
    from
    to
    amount
    asset
  }
}`,
    mockResult: {
      operations: [
        { id: "192837465019283746", type: "payment", createdAt: "2026-05-06T09:15:00Z", from: "GABC...1234", to: "GXYZ...9999", amount: "100.0000000", asset: "XLM" },
        { id: "192837465019283740", type: "payment", createdAt: "2026-05-05T14:30:00Z", from: "GDEF...5678", to: "GABC...1234", amount: "500.0000000", asset: "USDC" },
      ],
    },
  },
  {
    name: "Contract Events",
    description: "Query Soroban contract events by contract address",
    query: `query ContractEvents($contractId: String!) {
  events(
    contractId: $contractId
    limit: 10
  ) {
    id
    type
    contractId
    ledger
    createdAt
    topics
    value
  }
}`,
    mockResult: {
      events: [
        { id: "0000000524812341-0000000001", type: "contract", contractId: "CCAMM...POOL", ledger: 52481234, createdAt: "2026-05-06T10:22:14Z", topics: ["swap", "XLM", "USDC"], value: { amount_in: "1000.0000000", amount_out: "117.9400000" } },
        { id: "0000000524812340-0000000002", type: "contract", contractId: "CCAMM...POOL", ledger: 52481234, createdAt: "2026-05-06T10:21:58Z", topics: ["liquidity_added"], value: { xlm: "5000.0000000", usdc: "589.7000000" } },
      ],
    },
  },
];
