/**
 * Registry reads: the Soroban plumbing is mocked, the decoding is real.
 *
 * `rpc.Server` is the only network touchpoint, so the whole read path — paging,
 * simulation, struct decoding, bigint amounts — is exercised against ScVal
 * shapes exactly as the contract serialises them.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Address,
  Keypair,
  StrKey,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk/base";

const getAccount = vi.hoisted(() => vi.fn());
const simulateTransaction = vi.hoisted(() => vi.fn());

vi.mock("@stellar/stellar-sdk/rpc", async () => {
  const actual = await vi.importActual<typeof import("@stellar/stellar-sdk/rpc")>(
    "@stellar/stellar-sdk/rpc",
  );
  return {
    ...actual,
    Server: vi
      .fn()
      .mockImplementation(() => ({ getAccount, simulateTransaction })),
  };
});

import {
  getActiveContracts,
  getActiveProfiles,
  getContractsByOwner,
  getReputation,
  getSlashes,
} from "./registry";

const CONTRACT = StrKey.encodeContract(Keypair.random().rawPublicKey());
const OWNER = Keypair.random().publicKey();

/** One struct value with the contract's field names — ScVal structs decode keyed by them. */
function struct(fields: [string, xdr.ScVal][]): xdr.ScVal {
  return xdr.ScVal.scvMap(
    fields.map(
      ([key, val]) =>
        new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol(key), val }),
    ),
  );
}

interface EntryOverrides {
  contract_id?: string;
  name?: string;
  description?: string;
  registered_at?: number;
  active?: boolean;
}

function entryValuePairs(
  overrides: EntryOverrides = {},
): [string, xdr.ScVal][] {
  return [
    ["contract_id", new Address(overrides.contract_id ?? CONTRACT).toScVal()],
    ["owner", new Address(OWNER).toScVal()],
    ["name", xdr.ScVal.scvString(overrides.name ?? "My Protocol")],
    [
      "description",
      xdr.ScVal.scvString(overrides.description ?? "A DeFi protocol"),
    ],
    [
      "registered_at",
      nativeToScVal(overrides.registered_at ?? 500, { type: "u32" }),
    ],
    ["active", xdr.ScVal.scvBool(overrides.active ?? true)],
  ];
}

function entryStruct(overrides: EntryOverrides = {}): xdr.ScVal {
  return struct(entryValuePairs(overrides));
}

function reputationStruct(
  overrides: Partial<{
    stake: bigint;
    verified: boolean;
    slashed_total: bigint;
    withdraw_locked_until: number;
  }> = {},
): xdr.ScVal {
  return struct([
    [
      "stake",
      nativeToScVal(overrides.stake ?? BigInt(50_000_000), { type: "i128" }),
    ],
    ["verified", xdr.ScVal.scvBool(overrides.verified ?? false)],
    [
      "slashed_total",
      nativeToScVal(overrides.slashed_total ?? BigInt(25_000_000), {
        type: "i128",
      }),
    ],
    [
      "withdraw_locked_until",
      nativeToScVal(overrides.withdraw_locked_until ?? 12_345, { type: "u32" }),
    ],
  ]);
}

/** A `ContractProfile`: the entry struct with its reputation attached. */
function profileStruct(
  entryOverrides: EntryOverrides = {},
  reputation: xdr.ScVal = reputationStruct(),
): xdr.ScVal {
  return struct([
    ...entryValuePairs(entryOverrides),
    ["reputation", reputation],
  ]);
}

function slashStruct(
  overrides: Partial<{
    amount: bigint;
    reason: string;
    slashed_at: number;
  }> = {},
): xdr.ScVal {
  return struct([
    [
      "amount",
      nativeToScVal(overrides.amount ?? BigInt(10_000_000), { type: "i128" }),
    ],
    ["reason", xdr.ScVal.scvString(overrides.reason ?? "Stale event schema")],
    [
      "slashed_at",
      nativeToScVal(overrides.slashed_at ?? 9_000, { type: "u32" }),
    ],
  ]);
}

/** The simulation response shape the SDK hands back for a successful read. */
function simResult(retval: xdr.ScVal) {
  return { result: { retval } };
}

beforeEach(() => {
  vi.clearAllMocks();
  // TransactionBuilder needs a live-ish account object to build against. Any
  // funded account works here — these reads simulate, they never sign or send.
  getAccount.mockResolvedValue({
    accountId: () => OWNER,
    sequenceNumber: () => '1',
    incrementSequenceNumber: () => {},
  });
});

describe("getContractsByOwner", () => {
  it("pages until a short batch comes back, mapping entries", async () => {
    // PAGE_LIMIT is 50: a full page then a short one.
    simulateTransaction
      .mockResolvedValueOnce(
        simResult(
          xdr.ScVal.scvVec(Array.from({ length: 50 }, () => entryStruct())),
        ),
      )
      .mockResolvedValueOnce(simResult(xdr.ScVal.scvVec([entryStruct()])));

    const entries = await getContractsByOwner(OWNER);

    expect(entries).toHaveLength(51);
    expect(entries[0]).toMatchObject({
      contractId: CONTRACT,
      owner: OWNER,
      name: "My Protocol",
      description: "A DeFi protocol",
      active: true,
      registeredAt: 500,
    });
    expect(simulateTransaction).toHaveBeenCalledTimes(2);
  });

  it("throws a readable error when the simulation fails", async () => {
    simulateTransaction.mockResolvedValue({ error: "internal error" });

    await expect(getContractsByOwner(OWNER)).rejects.toThrow(
      "Registry simulation failed",
    );
  });
});

describe("getActiveContracts", () => {
  it("reads the first page and maps entries", async () => {
    simulateTransaction.mockResolvedValue(
      simResult(xdr.ScVal.scvVec([entryStruct()])),
    );

    const entries = await getActiveContracts();

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("My Protocol");
  });
});

describe("getActiveProfiles", () => {
  it("attaches reputation to each entry in the same read", async () => {
    simulateTransaction.mockResolvedValue(
      simResult(
        xdr.ScVal.scvVec([
          profileStruct(
            {},
            reputationStruct({ stake: BigInt(50_000_000), verified: true }),
          ),
        ]),
      ),
    );

    const profiles = await getActiveProfiles();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].reputation).toEqual({
      stake: BigInt(50_000_000),
      verified: true,
      slashedTotal: BigInt(25_000_000),
      withdrawLockedUntil: 12_345,
    });
  });

  it("reads several pages of profiles before a short batch ends it", async () => {
    simulateTransaction
      .mockResolvedValueOnce(
        simResult(
          xdr.ScVal.scvVec(Array.from({ length: 50 }, () => profileStruct())),
        ),
      )
      .mockResolvedValueOnce(simResult(xdr.ScVal.scvVec([profileStruct()])));

    const profiles = await getActiveProfiles();

    expect(profiles).toHaveLength(51);
    expect(profiles[0].reputation.verified).toBe(false);
  });
});

describe("getReputation", () => {
  it("decodes the tolerance read: zeroed values for an unregistered contract", async () => {
    // The contract returns zeroed values rather than erroring — the truth for
    // a contract that was never registered.
    simulateTransaction.mockResolvedValue(
      simResult(
        reputationStruct({
          stake: BigInt(0),
          slashed_total: BigInt(0),
          withdraw_locked_until: 0,
        }),
      ),
    );

    const reputation = await getReputation(CONTRACT);

    expect(reputation).toEqual({
      stake: BigInt(0),
      verified: false,
      slashedTotal: BigInt(0),
      withdrawLockedUntil: 0,
    });
  });

  it("decodes bigint amounts and the withdraw lock", async () => {
    simulateTransaction.mockResolvedValue(
      simResult(reputationStruct({ stake: BigInt(1_234_567_890) })),
    );

    const reputation = await getReputation(CONTRACT);

    expect(reputation.stake).toBe(BigInt(1_234_567_890));
    expect(reputation.withdrawLockedUntil).toBe(12_345);
  });
});

describe("getSlashes", () => {
  it("returns every slash with its reason and ledger, oldest first", async () => {
    simulateTransaction.mockResolvedValue(
      simResult(
        xdr.ScVal.scvVec([
          slashStruct({
            amount: BigInt(10_000_000),
            reason: "Stale event schema",
            slashed_at: 9_000,
          }),
          slashStruct({
            amount: BigInt(5_000_000),
            reason: "Indexed wrong contract",
            slashed_at: 9_100,
          }),
        ]),
      ),
    );

    const slashes = await getSlashes(CONTRACT);

    expect(slashes).toEqual([
      {
        amount: BigInt(10_000_000),
        reason: "Stale event schema",
        slashedAt: 9_000,
      },
      {
        amount: BigInt(5_000_000),
        reason: "Indexed wrong contract",
        slashedAt: 9_100,
      },
    ]);
  });

  it("returns an empty history for a contract that was never slashed", async () => {
    simulateTransaction.mockResolvedValue(simResult(xdr.ScVal.scvVec([])));

    await expect(getSlashes(CONTRACT)).resolves.toEqual([]);
  });
});

describe("scValToNative round trip", () => {
  it("decodes a profile vec the way the mappers expect", () => {
    const decoded = scValToNative(
      xdr.ScVal.scvVec([profileStruct()]),
    )[0] as Record<string, unknown>;
    expect(Object.keys(decoded)).toEqual([
      "contract_id",
      "owner",
      "name",
      "description",
      "registered_at",
      "active",
      "reputation",
    ]);
    expect(
      typeof (decoded["reputation"] as Record<string, unknown>)["stake"],
    ).toBe("bigint");
  });
});
