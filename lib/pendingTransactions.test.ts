import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetPendingTransactions,
  dismissTransaction,
  getPendingTransactions,
  MAX_SETTLED_TRANSACTIONS,
  subscribePendingTransactions,
  trackTransaction,
  type PendingTransaction,
} from "./pendingTransactions";
import type { TxPhase } from "./sorobanTx";
import { invalidateQueryCache, queryGeneration, readQuery, writeQuery } from "./queryCache";

/** A run whose promise the test settles by hand, so each phase can be observed mid-flight. */
function deferredRun<T extends { hash: string }>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const run = (report: (phase: TxPhase) => void) => {
    report("awaiting-signature");
    return new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
  };
  return { run, resolve: (value: T) => resolve(value), reject: (reason: unknown) => reject(reason) };
}

function current(): PendingTransaction[] {
  return getPendingTransactions();
}

beforeEach(() => {
  __resetPendingTransactions();
  invalidateQueryCache();
});

describe("trackTransaction", () => {
  it("lists the transaction as soon as it is submitted, with no result yet", () => {
    const { run } = deferredRun<{ hash: string }>();
    void trackTransaction("Deactivate CABC…", run);

    expect(current()).toHaveLength(1);
    expect(current()[0]).toMatchObject({ label: "Deactivate CABC…", hash: null, error: null });
  });

  it("records the phase the write reports", () => {
    const { run } = deferredRun<{ hash: string }>();
    void trackTransaction("Register", run);

    expect(current()[0].phase).toBe("awaiting-signature");
  });

  it("settles to success with the hash and resolves with the same result", async () => {
    const deferred = deferredRun<{ hash: string }>();
    const result = trackTransaction("Register", deferred.run);
    deferred.resolve({ hash: "abc123" });

    await expect(result).resolves.toEqual({ hash: "abc123" });
    expect(current()[0]).toMatchObject({ phase: "success", hash: "abc123", error: null });
  });

  it("invalidates the query cache once the write confirms", async () => {
    writeQuery("account", "before", { generation: queryGeneration() });
    const deferred = deferredRun<{ hash: string }>();
    const result = trackTransaction("Stake", deferred.run);

    expect(readQuery("account")).toBeDefined();
    deferred.resolve({ hash: "h" });
    await result;

    expect(readQuery("account")).toBeUndefined();
  });

  it("does not invalidate the query cache when the write fails", async () => {
    writeQuery("account", "before", { generation: queryGeneration() });
    const deferred = deferredRun<{ hash: string }>();
    const result = trackTransaction("Stake", deferred.run);
    deferred.reject(new Error("declined"));
    await expect(result).rejects.toThrow("declined");

    expect(readQuery("account")).toBeDefined();
  });

  it("settles to error with the message and rethrows so the caller still sees the failure", async () => {
    const deferred = deferredRun<{ hash: string }>();
    const result = trackTransaction("Withdraw", deferred.run);
    deferred.reject(new Error("Signature was declined in your wallet."));

    await expect(result).rejects.toThrow("Signature was declined in your wallet.");
    expect(current()[0]).toMatchObject({
      phase: "error",
      error: "Signature was declined in your wallet.",
    });
  });

  it("records no message when the failure carries none", async () => {
    const deferred = deferredRun<{ hash: string }>();
    const result = trackTransaction("Withdraw", deferred.run);
    deferred.reject("not an Error");

    await expect(result).rejects.toBe("not an Error");
    expect(current()[0]).toMatchObject({ phase: "error", error: null });
  });

  it("keeps the newest settled entries and never drops one still in flight", async () => {
    const inFlight = deferredRun<{ hash: string }>();
    void trackTransaction("still going", inFlight.run);

    for (let i = 0; i <= MAX_SETTLED_TRANSACTIONS; i++) {
      const done = deferredRun<{ hash: string }>();
      const result = trackTransaction(`done ${i}`, done.run);
      done.resolve({ hash: `h${i}` });
      await result;
    }

    const labels = current().map((tx) => tx.label);
    expect(labels).toContain("still going");
    expect(labels).not.toContain("done 0");
    expect(labels).toContain(`done ${MAX_SETTLED_TRANSACTIONS}`);
    expect(current().filter((tx) => tx.phase === "success")).toHaveLength(MAX_SETTLED_TRANSACTIONS);
  });
});

describe("dismissTransaction", () => {
  it("removes a settled transaction", async () => {
    const deferred = deferredRun<{ hash: string }>();
    const result = trackTransaction("Register", deferred.run);
    deferred.resolve({ hash: "h" });
    await result;

    dismissTransaction(current()[0].id);

    expect(current()).toEqual([]);
  });

  it("does not remove a transaction that is still in flight", () => {
    void trackTransaction("Register", deferredRun<{ hash: string }>().run);

    dismissTransaction(current()[0].id);

    expect(current()).toHaveLength(1);
  });

  it("ignores an id that is not in the list", () => {
    dismissTransaction(9_999);

    expect(current()).toEqual([]);
  });
});

describe("subscribePendingTransactions", () => {
  it("notifies a subscriber on every change and stops after unsubscribing", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePendingTransactions(listener);

    void trackTransaction("Register", deferredRun<{ hash: string }>().run);
    expect(listener).toHaveBeenCalled();

    const calls = listener.mock.calls.length;
    unsubscribe();
    void trackTransaction("Stake", deferredRun<{ hash: string }>().run);

    expect(listener.mock.calls.length).toBe(calls);
  });
});
