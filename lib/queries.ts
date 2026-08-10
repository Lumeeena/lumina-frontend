export interface QueryExample {
  name: string;
  description: string;
  query: string;
}

// Examples use inline literal arguments (rather than $variables) so "Run Query"
// can execute them against the live GraphQL server with no separate variables panel.
export const QUERY_EXAMPLES: QueryExample[] = [
  {
    name: "Recent Transactions",
    description: "Fetch the last 5 transactions on the network",
    query: `query RecentTransactions {
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
}`,
  },
  {
    name: "Account Balances",
    description: "Get all asset balances for an account (edit the address below)",
    query: `query AccountBalances {
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
}`,
  },
  {
    name: "Payment History",
    description: "Fetch payment operations for an account (edit the address below)",
    query: `query PaymentHistory {
  operations(
    account: "GABC...EXAMPLE"
    type: PAYMENT
    limit: 10
  ) {
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
}`,
  },
  {
    name: "Contract Events",
    description: "Query Soroban contract events by contract address (edit the contract ID below)",
    query: `query ContractEvents {
  events(
    contractId: "CABC...EXAMPLE"
    limit: 10
  ) {
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
}`,
  },
];
