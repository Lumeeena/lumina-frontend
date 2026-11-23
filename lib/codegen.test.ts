import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// codegen.ts reads NEXT_PUBLIC_GRAPHQL_URL once, at module load. Each test
// stubs the variable and re-imports the module so the result never depends on
// the developer's shell environment.
const DEFAULT_URL = "https://graphql.lumina.app/graphql";
const QUERY = "query GetBalances {\n  balance\n}";

async function loadCodegen() {
  vi.resetModules();
  return import("./codegen");
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GRAPHQL_URL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("generateJavaScriptClient", () => {
  it("builds a fetch snippet against the default endpoint with no auth header", async () => {
    const { generateJavaScriptClient } = await loadCodegen();

    const snippet = generateJavaScriptClient(QUERY);

    expect(snippet).toContain(`fetch("${DEFAULT_URL}"`);
    expect(snippet).toContain(
      "// Note: This query doesn't require authentication",
    );
    expect(snippet).not.toContain("Authorization");
    expect(snippet).toContain('operationName: "",');
  });

  it("adds a bearer Authorization header when an API key is given", async () => {
    const { generateJavaScriptClient } = await loadCodegen();

    const snippet = generateJavaScriptClient(QUERY, "abc123");

    expect(snippet).toContain('"Authorization": "Bearer abc123",');
    expect(snippet).toContain(
      "// Replace YOUR_API_KEY with your actual API key",
    );
    expect(snippet).not.toContain("// Note: This query doesn't require");
  });

  it("sets operationName when one is given", async () => {
    const { generateJavaScriptClient } = await loadCodegen();

    const snippet = generateJavaScriptClient(QUERY, undefined, "GetBalances");

    expect(snippet).toContain('operationName: "GetBalances",');
  });

  it("indents each query line by two spaces inside the template literal", async () => {
    const { generateJavaScriptClient } = await loadCodegen();

    const snippet = generateJavaScriptClient(QUERY);

    expect(snippet).toContain("  query GetBalances {\n    balance\n  }");
  });

  it("uses the endpoint from NEXT_PUBLIC_GRAPHQL_URL when it is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GRAPHQL_URL", "http://localhost:4000/graphql");
    const { generateJavaScriptClient } = await loadCodegen();

    const snippet = generateJavaScriptClient(QUERY);

    expect(snippet).toContain('fetch("http://localhost:4000/graphql"');
    expect(snippet).not.toContain(DEFAULT_URL);
  });
});

describe("generatePythonClient", () => {
  it("uses a placeholder key and a commented-out auth header when no key is given", async () => {
    const { generatePythonClient } = await loadCodegen();

    const snippet = generatePythonClient(QUERY);

    expect(snippet).toContain(`url = "${DEFAULT_URL}"`);
    expect(snippet).toContain(
      'api_key = "YOUR_API_KEY"  # Replace with your actual API key',
    );
    expect(snippet).toContain(
      '# "Authorization": f"Bearer {api_key}",  # Add your API key here',
    );
    expect(snippet).not.toContain('    "Authorization": f"Bearer {api_key}",');
    expect(snippet).not.toContain('"operationName"');
  });

  it("embeds the given key and an active auth header when a key is given", async () => {
    const { generatePythonClient } = await loadCodegen();

    const snippet = generatePythonClient(QUERY, "abc123");

    expect(snippet).toContain('api_key = "abc123"');
    expect(snippet).toContain('    "Authorization": f"Bearer {api_key}",');
  });

  it("includes operationName in the payload when one is given", async () => {
    const { generatePythonClient } = await loadCodegen();

    const snippet = generatePythonClient(QUERY, undefined, "GetBalances");

    expect(snippet).toContain('"operationName": "GetBalances",');
  });

  it("embeds the query verbatim in a triple-quoted string", async () => {
    const { generatePythonClient } = await loadCodegen();

    const snippet = generatePythonClient(QUERY);

    expect(snippet).toContain(`query = """\n${QUERY}\n"""`);
  });
});

describe("generateCurlCommand", () => {
  it("posts to the default endpoint with a commented-out auth header when no key is given", async () => {
    const { generateCurlCommand } = await loadCodegen();

    const snippet = generateCurlCommand(QUERY);

    expect(snippet.startsWith("curl -X POST \\")).toBe(true);
    expect(snippet).toContain(`  "${DEFAULT_URL}" \\`);
    expect(snippet).toContain('  -H "Content-Type: application/json" \\');
    expect(snippet).toContain(
      '  # -H "Authorization: Bearer YOUR_API_KEY" \\  # Add your API key if needed',
    );
    expect(snippet).not.toContain('-H "Authorization: Bearer abc123"');
  });

  it("adds a bearer Authorization header when an API key is given", async () => {
    const { generateCurlCommand } = await loadCodegen();

    const snippet = generateCurlCommand(QUERY, "abc123");

    expect(snippet).toContain('  -H "Authorization: Bearer abc123" \\');
  });

  it("puts a JSON payload with the query in the -d argument", async () => {
    const { generateCurlCommand } = await loadCodegen();

    const snippet = generateCurlCommand("{ balance }");

    expect(snippet).toContain(`-d '{"query":"{ balance }"}'`);
    expect(snippet).not.toContain("operationName");
  });

  it("includes operationName in the payload when one is given", async () => {
    const { generateCurlCommand } = await loadCodegen();

    const snippet = generateCurlCommand(
      "{ balance }",
      undefined,
      "GetBalances",
    );

    expect(snippet).toContain(
      `-d '{"query":"{ balance }","operationName":"GetBalances"}'`,
    );
  });

  it("escapes single quotes in the query so the shell argument stays intact", async () => {
    const { generateCurlCommand } = await loadCodegen();

    const snippet = generateCurlCommand("{ account(id: 'x') }");

    expect(snippet).toContain(
      `-d '{"query":"{ account(id: '"'"'x'"'"') }"}'`,
    );
  });
});
