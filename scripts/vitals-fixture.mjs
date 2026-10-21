import { createServer } from "node:http";

// Deterministic, read-only fixtures for the performance job. Never a production API.
const address = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const contractId = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";
const timestamp = "2026-01-01T00:00:00.000Z";
const transactions = Array.from({ length: 20 }, (_, index) => ({
  hash: (index + 1).toString(16).padStart(64, "0"),
  ledger: 1000 + index,
  createdAt: timestamp,
  sourceAccount: address,
  feeCharged: "100",
  operationCount: 1,
  successful: true,
  memoType: "text",
  memo: "Payroll",
  operations: [],
}));
const operations = transactions.map((transaction, index) => ({
  id: String(index + 1),
  type: "payment",
  createdAt: timestamp,
  transactionHash: transaction.hash,
  sourceAccount: address,
  from: address,
  to: address,
  amount: "10.0000000",
  asset: "native",
  startingBalance: null,
  funder: null,
  offerId: null,
  price: null,
  selling: null,
  buying: null,
}));
const asset = {
  asset: "native",
  code: "XLM",
  issuer: null,
  native: true,
  supply: "1000000",
  holders: 1000,
  series: Array.from({ length: 7 }, (_, index) => ({
    bucketStart: `2026-01-0${index + 1}T00:00:00Z`,
    volume: 1000 + index,
    operationCount: 10,
  })),
};
const page = (items) => ({
  items,
  pageInfo: { hasNextPage: false, cursor: null },
});
const data = {
  latestLedger: {
    sequence: 1020,
    closedAt: timestamp,
    transactionCount: 20,
    operationCount: 20,
  },
  transactions: page(transactions),
  operations: page(operations),
  search: page(transactions),
  transaction: transactions[0],
  account: {
    address,
    sequence: "100",
    subentryCount: 0,
    lastModifiedLedger: 1020,
    numSponsored: 0,
    numSponsoring: 0,
    balances: [
      {
        assetType: "native",
        assetCode: null,
        assetIssuer: null,
        balance: "1000.0000000",
        limit: null,
      },
    ],
    flags: {
      authRequired: false,
      authRevocable: false,
      authImmutable: false,
      authClawbackEnabled: false,
    },
    transactions,
    operations,
  },
  assets: page([asset]),
  asset,
  events: page([
    {
      id: "event-1",
      type: "contract",
      contractId,
      ledger: 1020,
      createdAt: timestamp,
      pagingToken: "1020-1",
      topics: ["transfer"],
      value: JSON.stringify({ amount: "10" }),
    },
  ]),
  contractDeployment: null,
  contractInterface: null,
  contractStorageEntries: page([
    {
      key: "counter",
      durability: "persistent",
      value: 1,
      lastModifiedLedger: 1020,
      expiration: 2000,
    },
  ]),
  contractStorageKeyHistory: page([]),
};

const server = createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }
  if (request.url === "/health") {
    response.end("ok");
    return;
  }
  if (request.url !== "/graphql") {
    response.writeHead(404).end();
    return;
  }
  request.resume();
  request.on("end", () => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ data }));
  });
});
server.listen(3201, "127.0.0.1", () =>
  console.log("Vitals fixture: http://127.0.0.1:3201"),
);
process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
