// @vitest-environment jsdom
/**
 * The playground's API key field (#8): a key entered in the page is sent as a
 * bearer token on Run Query, and never appears in the query text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/graphql", () => ({
  gqlFetch: vi.fn(),
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

vi.mock("@uiw/react-codemirror", async () => {
  const React = await import("react");
  return {
    default: ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value: string) => void;
    }) =>
      React.createElement("textarea", {
        value,
        onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value),
      }),
  };
});

import GraphQLPage from "./page";

const KEY = "lum_live_abcdef12";

function okResponse() {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    json: async () => ({ data: { latestLedger: { sequence: 1 } } }),
  };
}

function sentInit(): { headers: Record<string, string>; body: string } {
  const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
  return fetchMock.mock.calls[0][1];
}

describe("GraphQLPage API key", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(okResponse());
  });

  afterEach(() => {
    global.fetch = originalFetch;
    cleanup();
  });

  it("sends the entered key as a bearer token and keeps it out of the query", async () => {
    render(<GraphQLPage />);

    await userEvent.type(screen.getByLabelText("API key (optional)"), KEY);
    await userEvent.click(screen.getByRole("button", { name: /run query/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const init = sentInit();
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(JSON.parse(init.body).query).not.toContain(KEY);
  });

  it("sends only the content type when no key has been entered", async () => {
    render(<GraphQLPage />);

    await userEvent.click(screen.getByRole("button", { name: /run query/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(sentInit().headers).toEqual({ "Content-Type": "application/json" });
  });

  it("does not send a key that cannot be carried in a header, and says why", async () => {
    render(<GraphQLPage />);

    await userEvent.type(
      screen.getByLabelText("API key (optional)"),
      "lum live key",
    );
    await userEvent.click(screen.getByRole("button", { name: /run query/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(
        /cannot contain spaces/,
      ),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
