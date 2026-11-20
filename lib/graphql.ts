import type { TypedDocumentString } from "./generated/graphql";
import {
  isFresh,
  queryGeneration,
  queryKey,
  queryTtl,
  readQuery,
  writeQuery,
} from "./queryCache";

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** How a caller stays in control of a request it may no longer want. */
export interface RequestOptions {
  /** Cancels the request — see `useAbortScope`, which owns the signal's lifetime. */
  signal?: AbortSignal;
}

/** `…(variables, options?)`, where the variables are what decide the rest. */
type GqlArgs<V extends Record<string, unknown>> =
  Record<string, never> extends V
    ? [variables?: V, options?: RequestOptions]
    : [variables: V, options?: RequestOptions];

export async function gqlFetch<T, V extends Record<string, unknown>>(
  url: string,
  document: TypedDocumentString<T, V>,
  ...args: GqlArgs<V>
): Promise<T> {
  const [variables, options] = args;
  const documentText = document.toString();
  const useBrowserCache =
    typeof window !== "undefined" && url === PUBLIC_GRAPHQL_URL;
  const key = useBrowserCache
    ? queryKey(url, documentText, variables ?? {})
    : null;
  const cached = key ? readQuery<T>(key) : undefined;
  const generation = useBrowserCache ? queryGeneration() : 0;
  if (cached && isFresh(cached, queryTtl(documentText))) return cached.data;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: documentText, variables }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed (${res.status})`);
  }

  const body = (await res.json()) as GraphQLResponse<T>;
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  if (!body.data) {
    throw new Error("GraphQL response had no data");
  }
  if (key) writeQuery(key, body.data, { generation });
  return body.data;
}

/** Server-side base URL — reaches the graphql-server container over the internal Docker network. */
export const GRAPHQL_URL =
  process.env.GRAPHQL_URL ?? "http://localhost:4000/graphql";

/** Browser-side base URL — must be reachable from the user's machine, so it's inlined at build time. */
export const PUBLIC_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
