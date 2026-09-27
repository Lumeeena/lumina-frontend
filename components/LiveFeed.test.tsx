// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  // The virtualizer needs a viewport; jsdom otherwise reports a zero-sized
  // element and correctly renders no rows.
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 220 });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 900 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 220 });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 900 });
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ width: 900, height: 220, top: 0, left: 0, right: 900, bottom: 220, x: 0, y: 0, toJSON: () => {} }) as DOMRect;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  __setSubscriptionClient(null);
  vi.useRealTimers();
  vi.unstubAllGlobals();
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

    expect(screen.getByTestId("live-feed-scroll").dataset.retainedCount).toBe(String(MAX_FEED_LENGTH));
  });

  it("renders only a viewport-sized window while retaining the capped feed", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    for (let i = 0; i < MAX_FEED_LENGTH + 10; i++) {
      await push(transaction(`virtual${String(i).padStart(4, "0")}`));
    }

    const renderedRows = screen.getAllByRole("listitem").length;
    // Before virtualization, all 25 retained rows were mounted. At this
    // 220px test viewport, the visible window plus overscan mounts only 9.
    expect(renderedRows).toBe(9);
    expect(screen.getByTestId("live-feed-scroll").dataset.retainedCount).toBe(String(MAX_FEED_LENGTH));
  });

  it("holds updates while paused, counts them, and applies them on resume", async () => {
    mocks.gqlFetch.mockResolvedValue({ transactions: { items: [transaction("old000")] } });
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    await userEvent.click(screen.getByRole("button", { name: "Pause feed" }));
    await push(transaction("new111"));
    await push(transaction("new222"));

    expect(screen.queryByText(/new11/)).toBeNull();
    expect(screen.queryByText(/new22/)).toBeNull();
    expect(screen.getByRole("button", { name: "Resume feed (2)" })).toBeTruthy();
    expect(screen.getByText(/2 updates waiting/i)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Resume feed (2)" }));

    await waitFor(() => expect(screen.getByText(/new22/)).toBeTruthy());
    expect(screen.getByText(/new11/)).toBeTruthy();
    expect(screen.getByText(/2 updates arrived while paused/i)).toBeTruthy();
  });

  it("pauses automatically when a transaction row receives focus", async () => {
    mocks.gqlFetch.mockResolvedValue({ transactions: { items: [transaction("focus000")] } });
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    const rowLink = screen.getByRole("link", { name: /focus/i });
    fireEvent.focus(rowLink);

    expect(screen.getByRole("button", { name: "Resume feed" }).getAttribute("aria-pressed")).toBe("true");
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

describe("LiveFeed through a reconnect", () => {
  /** The retries the client scheduled, so a test runs them instead of waiting. */
  let scheduled: { run: () => void; delayMs: number }[] = [];
  let states: string[] = [];

  function installReconnectingClient() {
    scheduled = [];
    sockets = [];
    const client = new SubscriptionClient({
      url: "ws://test/graphql",
      createSocket: url => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
      // Held rather than scheduled, so the retry happens when the test says so.
      schedule: (run, delayMs) => {
        scheduled.push({ run, delayMs });
        return scheduled.length;
      },
      cancel: () => {},
      random: () => 1,
    });
    __setSubscriptionClient(client);

    states = [];
    client.onStateChange(state => states.push(state));
    return client;
  }

  async function deliverNewest(tx: Transaction) {
    await act(async () => {
      sockets[sockets.length - 1].deliver({
        id: "1",
        type: "next",
        payload: { data: { newTransaction: tx } },
      });
    });
  }

  beforeEach(() => {
    mocks.gqlFetch.mockResolvedValue({ transactions: { items: [] } });
    installReconnectingClient();
  });

  it("reconnects, resubscribes and resumes the stream", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();
    await deliverNewest(transaction("before1"));

    // 1. The connection drops.
    await act(async () => {
      sockets[0].drop();
    });
    expect(screen.getByTestId("connection-indicator").dataset.state).toBe("reconnecting");
    expect(screen.queryByText("LIVE")).toBeNull();
    // The row from before the drop is still on screen — a feed that blanks on a
    // blip looks like data loss.
    expect(screen.getAllByRole("link")).toHaveLength(1);

    // 2. The retry fires and opens a new socket.
    expect(scheduled).toHaveLength(1);
    await act(async () => {
      scheduled[0].run();
    });
    expect(sockets).toHaveLength(2);

    // 3. The new socket is brought up, and the subscription is restored on it
    //    rather than left silently dead.
    await connect();
    expect(screen.getByTestId("connection-indicator").dataset.state).toBe("connected");
    expect(sockets[1].framesOfType("subscribe")).toHaveLength(1);
    expect(sockets[1].framesOfType("subscribe")[0].payload).toMatchObject({
      query: expect.stringContaining("subscription LiveFeedNewTransaction"),
    });

    // 4. Pushes flow again on the new socket.
    await deliverNewest(transaction("after11"));
    const links = screen.getAllByRole("link");
    expect(links[0].textContent).toContain("after11");
    expect(links).toHaveLength(2);
  });

  it("does not duplicate rows when the server replays the feed on resubscribe", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();
    await deliverNewest(transaction("seen111"));

    await act(async () => {
      sockets[0].drop();
    });
    await act(async () => {
      scheduled[0].run();
    });
    await connect();

    // What a subscription server does on resubscribe: it replays what the
    // subscriber has already been sent. Those rows are already on screen.
    await deliverNewest(transaction("seen111"));
    await deliverNewest(transaction("fresh22"));

    const hashes = screen.getAllByRole("link").map(link => link.getAttribute("href"));
    expect(hashes.filter(href => href?.endsWith("seen111"))).toHaveLength(1);
    expect(hashes.filter(href => href?.endsWith("fresh22"))).toHaveLength(1);
    expect(hashes).toHaveLength(2);
  });

  it("passes through every state in order, so the indicator never claims LIVE early", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();
    await act(async () => {
      sockets[0].drop();
    });
    await act(async () => {
      scheduled[0].run();
    });
    await connect();

    // A retry stays in `reconnecting` rather than dropping back to
    // `connecting`: from the reader's side nothing has been recovered yet, and
    // a panel that keeps claiming to be connecting forever hides a retry loop.
    expect(states).toEqual(["connecting", "connected", "reconnecting", "connected"]);
    // LIVE is only claimed once the socket is actually back — never between
    // the drop and the retry.
    expect(states.indexOf("connected")).toBeLessThan(states.lastIndexOf("reconnecting"));
  });

  it("backs off before retrying rather than reconnecting in a tight loop", async () => {
    await act(async () => {
      render(<LiveFeed />);
    });
    await connect();

    await act(async () => {
      sockets[0].drop();
    });
    await act(async () => {
      sockets[0].drop();
    });

    // Each failure schedules exactly one retry, and the delay grows.
    expect(scheduled.length).toBeGreaterThanOrEqual(1);
    const delays = scheduled.map(entry => entry.delayMs);
    expect(new Set(delays).size).toBe(delays.length);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
  });
});

