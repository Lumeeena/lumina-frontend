import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { gqlFetch } from "./graphql";
import {
  AccountDetailDocument,
  TransactionPageDocument,
  type TransactionPageQuery,
} from "./generated/graphql";

afterEach(() => vi.unstubAllGlobals());

describe("typed GraphQL transport", () => {
  it("serializes the generated operation as query text and infers its result", async () => {
    const data: TransactionPageQuery = {
      transactions: {
        items: [],
        pageInfo: { hasNextPage: false, cursor: null },
      },
    };
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ data }) });
    vi.stubGlobal("fetch", fetch);
    const result = await gqlFetch("/graphql", TransactionPageDocument, {
      limit: 50,
      cursor: null,
    });
    expectTypeOf(result).toEqualTypeOf<TransactionPageQuery>();
    expect(result).toEqual(data);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      query: TransactionPageDocument.toString(),
      variables: { limit: 50, cursor: null },
    });
  });

  it.each([
    [{ ok: false, status: 503 }, "GraphQL request failed (503)"],
    [
      {
        ok: true,
        json: async () => ({ errors: [{ message: "Invalid query" }] }),
      },
      "Invalid query",
    ],
    [{ ok: true, json: async () => ({}) }, "GraphQL response had no data"],
  ])("preserves API failure handling", async (response, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(gqlFetch("/graphql", TransactionPageDocument)).rejects.toThrow(
      message,
    );
  });

  it("retains nullable account results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { account: null } }),
      }),
    );
    expect(
      await gqlFetch("/graphql", AccountDetailDocument, {
        address: "GACCOUNT",
      }),
    ).toEqual({ account: null });
  });

  it("hands the caller's signal to fetch so it can cancel the request", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();

    await gqlFetch(
      "/graphql",
      TransactionPageDocument,
      { limit: 50, cursor: null },
      { signal: controller.signal },
    );

    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it("propagates a cancellation rather than reporting it as an API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
    );

    await expect(
      gqlFetch(
        "/graphql",
        TransactionPageDocument,
        { limit: 50, cursor: null },
        {
          signal: new AbortController().signal,
        },
      ),
    ).rejects.toThrow("Aborted");
  });
});

// Checked by tsc/next build; never executed or sent to the API.
function variableTypeChecks() {
  // @ts-expect-error AccountDetail requires variables.
  void gqlFetch("/graphql", AccountDetailDocument);
  // @ts-expect-error The schema requires a string address.
  void gqlFetch("/graphql", AccountDetailDocument, { address: 123 });
  // @ts-expect-error Unknown variables are rejected.
  void gqlFetch("/graphql", TransactionPageDocument, { removed: true });
  // @ts-expect-error Raw strings cannot claim arbitrary response types.
  void gqlFetch("/graphql", "query { removed }");
}
void variableTypeChecks;
