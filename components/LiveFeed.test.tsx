// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SubscriptionClient } from "@/lib/subscriptions";
import { FakeSocket } from "@/lib/__fixtures__/fakeSocket";
import { __setSubscriptionClient } from "@/lib/useSubscription";
import type { Transaction } from "@/lib/types";

const mocks = vi.hoisted(() => ({ gqlFetch: vi.fn() }));

vi.mock("@/lib/graphql", () => ({
  gqlFetch: mocks.gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import LiveFeed, { FALLBACK_POLL_MS, MAX_FEED_LENGTH } from "./LiveFeed";

function transaction(hash: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    hash,
    ledger: 1,
    createdAt: new Date().toISOString(),
    sourceAccount: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    feeCharged: "100",
    operationCount: 1,
    successful: true,
    memoType: null,
    memo: null,
    ...overrides,
  };
}

let sockets: FakeSocket[] = [];

function installClient() {
  sockets = [];
  const client = new SubscriptionClient({
    url: "ws://test/graphql",
    createSocket: url => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket;
    },
    // Retries are driven by hand so a test never waits on a real timer.
    schedule: () => null,
    cancel: () => {},
    random: () => 1,
  });
  __setSubscriptionClient(client);
  return client;
}

/** Bring the newest socket up, inside `act` so React flushes the state change. */
async function connect() {
  await act(async () => {
    sockets[sockets.length - 1].open();
    sockets[sockets.length - 1].ack();
  });
}

async function push(tx: Transaction) {
  await act(async () => {
    sockets[sockets.length - 1].deliver({
      id: "1",
      type: "next",
      payload: { data: { newTransaction: tx } },
    });
  });
}

beforeEach(() => {
  mocks.gqlFetch.mockReset();
  mocks.gqlFetch.mockResolvedValue({ transactions: { items: [] } });
  installClient();
});

afterEach(() => {
  cleanup();
  __setSubscriptionClient(null);
  vi.useRealTimers();
});

describe("LiveFeed", () => {
  it("seeds from a single query so the panel is not empty before the first push", async () => {
    mocks.gqlFetch.mockResolvedValue({
      transactions: { items: [transaction("aaa111"), transaction("bbb222")] },
    });

    await act(async () => {
      render(<LiveFeed />);
    });

    expect(mocks.gqlFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/aaa11/)).toBeTruthy();
  });

  it("does not poll while the live connection is healthy", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    const afterSeed = mocks.gqlFetch.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(FALLBACK_POLL_MS * 3);
    });

    // The whole point of the rewrite: a healthy subscription means no interval.
    expect(mocks.gqlFetch.mock.calls.length).toBe(afterSeed);
  });

  it("shows LIVE once connected", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    expect(screen.getByTestId("connection-indicator").dataset.state).toBe("connected");
    expect(screen.getByText("LIVE")).toBeTruthy();
  });

  it("prepends pushed transactions, newest first", async () => {
    mocks.gqlFetch.mockResolvedValue({ transactions: { items: [transaction("old000")] } });

    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();
    await push(transaction("new111"));

    const links = screen.getAllByRole("link");
    expect(links[0].textContent).toContain("new11");
    expect(links[1].textContent).toContain("old00");
  });

  it("ignores a transaction it is already showing", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    // A reconnect can replay the most recent item; it must not double up.
    await push(transaction("dup999"));
    await push(transaction("dup999"));

    expect(screen.getAllByRole("link").filter(a => a.textContent?.includes("dup99"))).toHaveLength(1);
  });

  it("caps the list so a long-lived tab does not grow without bound", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    for (let i = 0; i < MAX_FEED_LENGTH + 10; i++) {
      await push(transaction(`hash${String(i).padStart(4, "0")}`));
    }

    expect(screen.getAllByRole("link")).toHaveLength(MAX_FEED_LENGTH);
  });

  it("reports reconnecting rather than silently stalling on a dropped connection", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    await act(async () => {
      sockets[0].drop();
    });

    expect(screen.getByTestId("connection-indicator").dataset.state).toBe("reconnecting");
    expect(screen.queryByText("LIVE")).toBeNull();
  });

  it("falls back to polling once the client gives up", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // maxAttempts 0 means the first drop exhausts the budget immediately.
    const client = new SubscriptionClient({
      url: "ws://test/graphql",
      createSocket: url => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
      schedule: () => null,
      cancel: () => {},
      retry: { maxAttempts: 0 },
    });
    sockets = [];
    __setSubscriptionClient(client);

    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();
    await act(async () => {
      sockets[0].drop();
    });

    expect(screen.getByTestId("connection-indicator").dataset.state).toBe("disconnected");
    expect(screen.getByText("POLLING")).toBeTruthy();

    const beforePolling = mocks.gqlFetch.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(FALLBACK_POLL_MS);
    });

    expect(mocks.gqlFetch.mock.calls.length).toBeGreaterThan(beforePolling);
  });

  it("keeps the last successful data when the seed query fails", async () => {
    mocks.gqlFetch.mockRejectedValue(new Error("network down"));

    await act(async () => {
      render(<LiveFeed />);
    });

    // No crash, and the empty state rather than a stuck spinner.
    expect(screen.getByText("No transactions found.")).toBeTruthy();
  });

  it("closes its subscription on unmount", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    cleanup();

    expect(sockets[0].framesOfType("complete")).toHaveLength(1);
    expect(sockets[0].closed).toBe(true);
  });
});
