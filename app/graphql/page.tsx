'use client';

import { useState } from "react";
import { QUERY_EXAMPLES, QueryExample } from "@/lib/queries";
import { Play } from "lucide-react";

function JsonHighlight({ data }: { data: object }) {
  const str = JSON.stringify(data, null, 2);
  const highlighted = str
    .replace(/("[\w\s]+"):/g, '<span style="color:#67e8f9">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span style="color:#86efac">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#fbbf24">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span style="color:#c084fc">$1</span>')
    .replace(/:\s*(null)/g, ': <span style="color:#94a3b8">$1</span>');
  return (
    <pre className="text-xs leading-relaxed font-mono text-slate-300 whitespace-pre-wrap break-all"
      dangerouslySetInnerHTML={{ __html: highlighted }} />
  );
}

export default function GraphQLPage() {
  const [selected, setSelected] = useState<QueryExample>(QUERY_EXAMPLES[0]);
  const [query, setQuery] = useState(QUERY_EXAMPLES[0].query);
  const [result, setResult] = useState<object | null>(null);

  function runQuery() { setResult(selected.mockResult); }

  function selectExample(ex: QueryExample) {
    setSelected(ex);
    setQuery(ex.query);
    setResult(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">GraphQL Playground</h1>
      <div className="flex items-center gap-3 mb-8">
        <p className="text-slate-400 text-sm">Lumina GraphQL endpoint:</p>
        <span className="mono text-xs px-2.5 py-1 rounded-full bg-amber-900/30 border border-amber-700/50 text-amber-400">Coming soon — testnet deployment in progress</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "600px" }}>
        <div className="lg:w-64 shrink-0 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Query Examples</h2>
          {QUERY_EXAMPLES.map(ex => (
            <button key={ex.name} onClick={() => selectExample(ex)}
              className={`text-left p-3 rounded-lg border transition-all ${selected.name === ex.name ? "border-cyan-700 bg-cyan-900/20 text-cyan-300" : "border-[#162032] bg-[#0c1222] text-slate-400 hover:border-cyan-800"}`}>
              <div className="text-sm font-semibold mb-1">{ex.name}</div>
              <div className="text-xs opacity-70 leading-snug">{ex.description}</div>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 flex flex-col rounded-xl bg-[#0c1222] border border-[#162032] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#162032]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Query Editor</span>
              <button onClick={runQuery} className="flex items-center gap-2 px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors" title="Run Query (Ctrl+Enter)">
                <Play size={13} /> Run Query
                <kbd className="text-xs opacity-60 border border-white/20 rounded px-1">⌘↵</kbd>
              </button>
            </div>
            <textarea value={query} onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-300 mono resize-none focus:outline-none leading-relaxed min-h-[280px]" spellCheck={false} />
          </div>

          <div className="rounded-xl bg-[#0c1222] border border-[#162032] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#162032]"><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response</span></div>
            <div className="p-4 max-h-72 overflow-y-auto">
              {result === null ? (
                <span className="text-slate-600 text-sm">Click &ldquo;Run Query&rdquo; to see the response.</span>
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
