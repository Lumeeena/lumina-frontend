'use client';

import { useState } from "react";
import { QUERY_EXAMPLES, QueryExample } from "@/lib/queries";
import { PUBLIC_GRAPHQL_URL } from "@/lib/graphql";

function JsonHighlight({ data }: { data: object }) {
  const str = JSON.stringify(data, null, 2);
  const highlighted = str
    .replace(/("[\w\s]+"):/g, '<span style="color:#7c3aed">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span style="color:#16a34a">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#d97706">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span style="color:#8b5cf6">$1</span>')
    .replace(/:\s*(null)/g, ': <span style="color:#a6a3b0">$1</span>');
  return (
    <pre className="text-xs leading-relaxed mono text-[#3f3d47] whitespace-pre-wrap break-all"
      dangerouslySetInnerHTML={{ __html: highlighted }} />
  );
}

export default function GraphQLPage() {
  const [selected, setSelected] = useState<QueryExample>(QUERY_EXAMPLES[0]);
  const [query, setQuery] = useState(QUERY_EXAMPLES[0].query);
  const [result, setResult] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function runQuery() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(PUBLIC_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const body = await res.json();
      if (body.errors?.length) {
        setError(body.errors.map((e: { message: string }) => e.message).join("; "));
        setResult(null);
      } else {
        setResult(body.data);
      }
    } catch {
      setError(`Couldn't reach the GraphQL server at ${PUBLIC_GRAPHQL_URL}. Is it running?`);
      setResult(null);
    } finally {
      setRunning(false);
    }
  }

  function selectExample(ex: QueryExample) {
    setSelected(ex);
    setQuery(ex.query);
    setResult(null);
    setError(null);
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">GraphQL Playground</h1>
      <div className="flex items-center gap-2.5 mb-7 flex-wrap">
        <p className="text-[#6b6975] text-[13px] m-0">Lumina GraphQL endpoint:</p>
        <span className="mono text-xs px-2.5 py-1 rounded-full bg-[#f3effe] text-[#6d28d9]">{PUBLIC_GRAPHQL_URL}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6" style={{ minHeight: "560px" }}>
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-wide uppercase text-[#a6a3b0] mb-1">Query Examples</h2>
          {QUERY_EXAMPLES.map(ex => (
            <button key={ex.name} onClick={() => selectExample(ex)}
              className={`text-left rounded-[10px] p-3 border transition-colors ${selected.name === ex.name ? "border-[#c4b5fd] bg-[#f3effe] text-[#6d28d9]" : "border-[#e5e3ea] bg-white text-[#3f3d47] hover:border-[#c4b5fd]"}`}>
              <span className="block font-bold text-[13px] mb-0.5">{ex.name}</span>
              <span className="block text-[11px] opacity-70 leading-snug">{ex.description}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col rounded-xl border border-[#e5e3ea] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]">
              <span className="text-[11px] font-bold tracking-wide uppercase text-[#a6a3b0]">Query Editor</span>
              <button onClick={runQuery} disabled={running} className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white font-bold text-[13px] px-4 py-[7px] rounded-[7px] transition-colors">
                {running ? "Running…" : "Run Query"}
              </button>
            </div>
            <textarea value={query} onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3.5 text-[13px] text-[#0e0e12] mono resize-none focus:outline-none leading-relaxed min-h-[280px]" spellCheck={false} />
          </div>

          <div className="rounded-xl border border-[#e5e3ea] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]"><span className="text-[11px] font-bold tracking-wide uppercase text-[#a6a3b0]">Response</span></div>
            <div className="p-3.5 px-4 max-h-[260px] overflow-y-auto">
              {error ? (
                <span className="text-[#dc2626] text-sm">{error}</span>
              ) : result === null ? (
                <span className="text-[#a6a3b0] text-sm">Click &ldquo;Run Query&rdquo; to see the response.</span>
              ) : (
                <JsonHighlight data={{ data: result }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
