interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export async function gqlFetch<T>(
  url: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed (${res.status})`);
  }

  const body = (await res.json()) as GraphQLResponse<T>;
  if (body.errors?.length) {
    throw new Error(body.errors.map(e => e.message).join('; '));
  }
  if (!body.data) {
    throw new Error('GraphQL response had no data');
  }
  return body.data;
}

/** Server-side base URL — reaches the graphql-server container over the internal Docker network. */
export const GRAPHQL_URL = process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql';

/** Browser-side base URL — must be reachable from the user's machine, so it's inlined at build time. */
export const PUBLIC_GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';
