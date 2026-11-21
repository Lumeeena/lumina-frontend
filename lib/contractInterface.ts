import {
  ContractDeploymentDocument,
  type ContractDeploymentQuery,
} from "./generated/graphql";

/**
 * How many same-code contracts to ask for. The API returns them without a
 * total, so a full page is shown as "the first N" rather than as all of them.
 */
export const SHARED_WASM_LIMIT = 10;

export interface ContractArgument {
  name: string;
  type: string;
}

export interface ContractFunction {
  name: string;
  inputs: ContractArgument[];
  outputs: string[];
}

/** Another contract deployed from the same wasm, with its own deployment. */
export interface SharedWasmContract {
  contractId: string;
  deployer: string;
  deployedLedger: number;
  deployedAt: string;
}

export interface ContractDeployment {
  deployer: string | null;
  deploymentLedger: number | null;
  wasmHash: string | null;
  /** Other contracts running the same code, never this one. */
  sharedWasmContracts: SharedWasmContract[];
}

export interface ContractInterfaceResult {
  functions: ContractFunction[];
  wasmHash?: string;
  deployment: ContractDeployment | null;
  unreadable: boolean;
  unavailable: boolean;
}

interface GraphQLPayload<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

function argument(value: unknown, index: number): ContractArgument | null {
  if (typeof value === "string")
    return { name: `arg${index + 1}`, type: value };
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.type !== "string") return null;
  return {
    name: typeof record.name === "string" ? record.name : `arg${index + 1}`,
    type: record.type,
  };
}

/** Accept both the typed API shape and the JSON shape used by early backends. */
export function normalizeFunctions(value: unknown): ContractFunction[] {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(candidate)) return [];

  return candidate.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (typeof record.name !== "string") return [];
    const rawInputs = Array.isArray(record.inputs)
      ? record.inputs
      : Array.isArray(record.args)
        ? record.args
        : [];
    const inputs = rawInputs
      .map((input, index) => argument(input, index))
      .filter((input): input is ContractArgument => input !== null);
    const rawOutputs = Array.isArray(record.outputs)
      ? record.outputs
      : record.output
        ? [record.output]
        : [];
    const outputs = rawOutputs.flatMap((output) => {
      if (typeof output === "string") return [output];
      if (
        output &&
        typeof output === "object" &&
        typeof (output as Record<string, unknown>).type === "string"
      ) {
        return [(output as Record<string, string>).type];
      }
      return [];
    });
    return [{ name: record.name, inputs, outputs }];
  });
}

async function query<T>(
  url: string,
  document: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: document, variables }),
    next: { revalidate: 60 },
  });
  if (!response.ok)
    throw new Error(`GraphQL request failed (${response.status})`);
  const payload = (await response.json()) as GraphQLPayload<T>;
  if (payload.errors?.length || !payload.data)
    throw new Error(payload.errors?.[0]?.message ?? "No data");
  return payload.data;
}

export async function getContractInterface(
  url: string,
  contractId: string,
): Promise<ContractInterfaceResult> {
  // From operations.graphql, so the selection is checked against the schema.
  // It used to be written inline here and asked for `deploymentLedger`, a
  // field the API does not have, which failed the whole request.
  const deploymentRequest = query<ContractDeploymentQuery>(
    url,
    ContractDeploymentDocument.toString(),
    { contractId, sharedLimit: SHARED_WASM_LIMIT },
  );
  const interfaceRequest = query<{
    contractInterface: null | { wasmHash?: string; functions: unknown };
  }>(
    url,
    `query ContractInterface($contractId: String!) {
      contractInterface(contractId: $contractId) { wasmHash functions }
    }`,
    { contractId },
  );

  const [deployment, contractInterface] = await Promise.allSettled([
    deploymentRequest,
    interfaceRequest,
  ]);
  const metadata =
    deployment.status === "fulfilled" ? deployment.value.contract : null;
  const specification =
    contractInterface.status === "fulfilled"
      ? contractInterface.value.contractInterface
      : null;
  const functions = normalizeFunctions(specification?.functions);

  return {
    functions,
    wasmHash: specification?.wasmHash ?? metadata?.wasmHash,
    deployment:
      metadata !== null
        ? {
            deployer: metadata.deployer ?? null,
            deploymentLedger: metadata.deployedLedger ?? null,
            wasmHash: metadata.wasmHash ?? null,
            // The API leaves this contract out already; filtered again so a
            // contract can never be listed as sharing code with itself.
            sharedWasmContracts: (metadata.sharedWasmContracts ?? []).filter(
              (shared) => shared.contractId !== contractId,
            ),
          }
        : null,
    unreadable:
      contractInterface.status === "fulfilled" &&
      Boolean(specification) &&
      functions.length === 0,
    unavailable:
      deployment.status === "rejected" &&
      contractInterface.status === "rejected",
  };
}
