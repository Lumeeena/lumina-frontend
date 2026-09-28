const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://graphql.lumina.app/graphql";

export function generateJavaScriptClient(
  query: string,
  apiKey?: string,
  operationName?: string
): string {
  const headers = apiKey ? `    "Authorization": "Bearer ${apiKey}",` : "";
  const comments = apiKey
    ? `// Replace YOUR_API_KEY with your actual API key from the developer dashboard`
    : `// Note: This query doesn't require authentication, but you can add an API key if needed`;

  return `${comments}

const query = \`
${query.split("\n").map((line) => `  ${line}`).join("\n")}
\`;

async function runQuery() {
  const response = await fetch("${GRAPHQL_URL}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",${headers}
    },
    body: JSON.stringify({
      query,
      operationName: "${operationName || ""}",
    }),
  });

  const data = await response.json();

  if (data.errors) {
    console.error("GraphQL Error:", data.errors);
    return;
  }

  console.log("Success:", data.data);
}

runQuery();`;
}

export function generatePythonClient(
  query: string,
  apiKey?: string,
  operationName?: string
): string {
  const auth_header = apiKey
    ? `    "Authorization": f"Bearer {api_key}",`
    : `    # "Authorization": f"Bearer {api_key}",  # Add your API key here`;

  const api_key_line = apiKey ? `api_key = "${apiKey}"` : `api_key = "YOUR_API_KEY"  # Replace with your actual API key`;

  return `import requests
import json

# Replace YOUR_API_KEY with your actual API key from the developer dashboard
${api_key_line}

url = "${GRAPHQL_URL}"

query = """
${query.split("\n").map((line) => line).join("\n")}
"""

payload = {
    "query": query,
    ${operationName ? `"operationName": "${operationName}",` : ""}
}

headers = {
    "Content-Type": "application/json",
${auth_header}
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

if "errors" in data:
    print("GraphQL Error:", data["errors"])
else:
    print("Success:", json.dumps(data["data"], indent=2))`;
}

export function generateCurlCommand(
  query: string,
  apiKey?: string,
  operationName?: string
): string {
  const payload = JSON.stringify({
    query,
    ...(operationName ? { operationName } : {}),
  });

  const authHeader = apiKey
    ? `  -H "Authorization: Bearer ${apiKey}" \\`
    : `  # -H "Authorization: Bearer YOUR_API_KEY" \\  # Add your API key if needed`;

  return `curl -X POST \\
  "${GRAPHQL_URL}" \\
  -H "Content-Type: application/json" \\
${authHeader}
  -d '${payload.replace(/'/g, "'\"'\"'")}'`;
}
