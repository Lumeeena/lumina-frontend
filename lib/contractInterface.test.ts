import { afterEach, describe, expect, it, vi } from "vitest";
import { getContractInterface, normalizeFunctions } from "./contractInterface";

afterEach(() => vi.restoreAllMocks());

describe("normalizeFunctions", () => {
  it("normalizes typed wasm function specifications", () => {
    expect(
      normalizeFunctions([
        {
          name: "transfer",
          inputs: [
            { name: "to", type: "Address" },
            { name: "amount", type: "i128" },
          ],
          outputs: [{ type: "Result<Void, Error>" }],
        },
      ]),
    ).toEqual([
      {
        name: "transfer",
        inputs: [
          { name: "to", type: "Address" },
          { name: "amount", type: "i128" },
        ],
        outputs: ["Result<Void, Error>"],
      },
    ]);
  });

  it("supports a JSON-encoded early-backend response", () => {
    expect(
      normalizeFunctions(
        '[{"name":"balance","args":["Address"],"output":"i128"}]',
      ),
    ).toEqual([
      {
        name: "balance",
        inputs: [{ name: "arg1", type: "Address" }],
        outputs: ["i128"],
      },
    ]);
  });

  it("returns no functions for an unreadable spec", () => {
    expect(normalizeFunctions("not json")).toEqual([]);
  });

  it("combines function specs with same-WASM contract links", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              contract: {
                wasmHash: "abc",
                sharedWasmContracts: [
                  { contractId: "CURRENT" },
                  { contractId: "SHARED" },
                ],
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              contractInterface: {
                wasmHash: "abc",
                functions: [{ name: "hello", inputs: [], outputs: ["Symbol"] }],
              },
            },
          }),
        ),
      );

    const result = await getContractInterface(
      "https://api.example/graphql",
      "CURRENT",
    );
    expect(result.functions[0].name).toBe("hello");
    expect(result.sharedContractIds).toEqual(["SHARED"]);
    expect(result.wasmHash).toBe("abc");
    expect(result.unavailable).toBe(false);
  });
});
