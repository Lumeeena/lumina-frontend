import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SHARED_WASM_LIMIT,
  getContractInterface,
  normalizeFunctions,
} from "./contractInterface";
import { ContractDeploymentDocument } from "./generated/graphql";

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

  it("combines function specs with the contracts that share this wasm", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              contract: {
                wasmHash: "abc",
                deployer: "GDEPLOYER",
                deployedLedger: 500,
                sharedWasmContracts: [
                  {
                    contractId: "CURRENT",
                    deployer: "GDEPLOYER",
                    deployedLedger: 500,
                    deployedAt: "2026-11-01T00:00:00Z",
                  },
                  {
                    contractId: "SHARED",
                    deployer: "GOTHER",
                    deployedLedger: 900,
                    deployedAt: "2026-11-20T00:00:00Z",
                  },
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
    expect(result.wasmHash).toBe("abc");
    expect(result.unavailable).toBe(false);
    expect(result.deployment).toEqual({
      deployer: "GDEPLOYER",
      deploymentLedger: 500,
      wasmHash: "abc",
      // The contract itself is never listed as sharing code with itself.
      sharedWasmContracts: [
        {
          contractId: "SHARED",
          deployer: "GOTHER",
          deployedLedger: 900,
          deployedAt: "2026-11-20T00:00:00Z",
        },
      ],
    });
  });

  it("asks for the deployment with the schema-checked operation", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { contract: null } })),
      );

    await getContractInterface("https://api.example/graphql", "CURRENT");

    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(body.query).toBe(ContractDeploymentDocument.toString());
    // The field is `deployedLedger`; asking for `deploymentLedger` failed the
    // whole request, so the deployment and its same-code list never showed.
    expect(body.query).toContain("deployedLedger");
    expect(body.query).not.toContain("deploymentLedger");
    expect(body.variables).toEqual({
      contractId: "CURRENT",
      sharedLimit: SHARED_WASM_LIMIT,
    });
  });

  it("lists no same-code contracts when the API returns none", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              contract: {
                wasmHash: "abc",
                deployer: "GDEPLOYER",
                deployedLedger: 500,
                sharedWasmContracts: null,
              },
            },
          }),
        ),
      )
      .mockRejectedValueOnce(new Error("interface down"));

    const result = await getContractInterface(
      "https://api.example/graphql",
      "CURRENT",
    );
    expect(result.deployment?.sharedWasmContracts).toEqual([]);
    expect(result.unavailable).toBe(false);
  });

  it("has no deployment, and so no same-code list, when that request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ errors: [{ message: "Cannot query field" }] }),
      ),
    );

    const result = await getContractInterface(
      "https://api.example/graphql",
      "CURRENT",
    );
    expect(result.deployment).toBeNull();
    expect(result.unavailable).toBe(true);
  });
});
