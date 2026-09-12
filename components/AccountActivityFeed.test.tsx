// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SubscriptionClient } from "@/lib/subscriptions";
import { FakeSocket } from "@/lib/__fixtures__/fakeSocket";
import { __setSubscriptionClient } from "@/lib/useSubscription";
import type { Operation } from "@/lib/types";
import AccountActivityFeed, { MAX_ACTIVITY_LENGTH } from "./AccountActivityFeed";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";
const OTHER = "GZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";

function operation(id: string, overrides: Partial<Operation> = {}): Operation {
  return {
    id,
    type: "payment",
    createdAt: new Date().toISOString(),
    transactionHash: `tx${id}`,
    sourceAccount: ADDRESS,
    from: ADDRESS,
    to: OTHER,
    amount: "10.0000000",
    asset: "XLM",
    startingBalance: null,
    funder: null,
    offerId: null,
    price: null,
    selling: null,
    buying: null,
    ...overrides,
  };
}

let sockets: FakeSocket[] = [];

function installClient(retry?: { maxAttempts?: number }) {
  sockets = [];
  __setSubscriptionClient(
    new SubscriptionClient({
      url: "ws://test/graphql",
      createSocket: url => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
      schedule: () => null,
      cancel: () => {},
      retry,
    }),
  );
}

async function connect() {
  await act(async () => {
    sockets[sockets.length - 1].open();
    sockets[sockets.length - 1].ack();
  });
}

async function push(op: Operation) {
  await act(async () => {
    sockets[sockets.length - 1].deliver({
      id: "1",
      type: "next",
      payload: { data: { accountActivity: op } },
    });
  });
}

beforeEach(() => installClient());

afterEach(() => {
  cleanup();
  __setSubscriptionClient(null);
});

describe("AccountActivityFeed", () => {
  it("subscribes with the account address as a variable", async () => {
    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();

    const [frame] = sockets[0].framesOfType("subscribe");
    expect(frame.payload).toMatchObject({ variables: { address: ADDRESS } });
  });

  it("waits visibly rather than looking broken on an account with no activity", async () => {
    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();

    expect(screen.getByText(/Waiting for new activity/)).toBeTruthy();
    expect(screen.getByTestId("connection-indicator").dataset.state).toBe("connected");
  });

  it("shows an operation the account sent", async () => {
    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();
    await push(operation("1"));

    expect(screen.getByText("payment")).toBeTruthy();
    expect(screen.getByText(/10\.0000000/)).toBeTruthy();
  });

  it("shows an operation the account received", async () => {
    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();
    await push(operation("1", { sourceAccount: OTHER, from: OTHER, to: ADDRESS }));

    expect(screen.getByText("payment")).toBeTruthy();
  });

  it("drops an operation that has nothing to do with this account", async () => {
    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();

    // The server filters by address, but this section is headed "Live Activity"
    // for *this* account — showing someone else's operation under it would be
    // straightforwardly wrong, so the component refuses it too.
    await push(operation("1", { sourceAccount: OTHER, from: OTHER, to: OTHER }));

    expect(screen.queryByText("payment")).toBeNull();
    expect(screen.getByText(/Waiting for new activity/)).toBeTruthy();
  });

  it("ignores an operation it is already showing", async () => {
    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();
    await push(operation("dup"));
    await push(operation("dup"));

    expect(screen.getAllByText("payment")).toHaveLength(1);
  });

  it("caps the list", async () => {
    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();

    for (let i = 0; i < MAX_ACTIVITY_LENGTH + 5; i++) {
      await push(operation(String(i)));
    }

    expect(screen.getAllByText("payment")).toHaveLength(MAX_ACTIVITY_LENGTH);
  });

  it("renders nothing when live updates are unavailable and nothing arrived", async () => {
    installClient({ maxAttempts: 0 });

    const { container } = render(<AccountActivityFeed address={ADDRESS} />);
    await connect();
    await act(async () => {
      sockets[0].drop();
    });

    // The server-rendered transaction table already covers history, so an
    // empty live panel would be noise rather than information.
    expect(container.querySelector('[data-testid="account-activity"]')).toBeNull();
  });

  it("keeps showing what it received even after the connection gives up", async () => {
    installClient({ maxAttempts: 0 });

    await act(async () => {
      render(<AccountActivityFeed address={ADDRESS} />);
    });
    await connect();
    await push(operation("1"));
    await act(async () => {
      sockets[0].drop();
    });

    expect(screen.getByText("payment")).toBeTruthy();
    expect(screen.getByTestId("connection-indicator").dataset.state).toBe("disconnected");
  });
});
