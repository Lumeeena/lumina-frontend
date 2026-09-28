// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const gqlFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
}));

import EventsPage from "./page";

afterEach(() => {
  cleanup();
  gqlFetch.mockReset();
});

describe("EventsPage decoded values", () => {
  it("renders decoded fields, precise integer strings, and copyable addresses", async () => {
    const address = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";
    const amount = "340282366920938463463374607431768211455";
    gqlFetch.mockResolvedValue({
      events: {
        items: [
          {
            id: "event-1",
            type: "contract",
            contractId: address,
            ledger: 42,
            createdAt: new Date().toISOString(),
            pagingToken: "42-1",
            topics: ["transfer"],
            value: JSON.stringify({ to: address, amount: { i128: amount } }),
          },
        ],
      },
    });

    render(
      await EventsPage({
        searchParams: Promise.resolve({ contractId: address }),
      }),
    );

    expect(screen.getByText(amount)).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /copy address/i }),
    ).toHaveLength(1);
    expect(screen.getByText("transfer")).toBeTruthy();
  });
});
