'use client';

import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { QUERY_EXAMPLES, QueryExample } from "@/lib/queries";
import { PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import { loadQueryHistory, saveQueryToHistory } from "@/lib/queryHistory";
import BackendUnavailable from "@/components/BackendUnavailable";

function JsonHighlight({ data }: { data: object }) {
  const str = JSON.stringify(data, null, 2);
  return (
    <pre className="text-xs leading-relaxed mono text-[var(--color-text-primary)] whitespace-pre-wrap break-all">{str}</pre>
  );
}

// A small GraphQL tokenizer keeps the editor's parser footprint minimal while
// still providing proper syntax highlighting, bracket matching and editing.
const graphqlLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/#[^\n]*/)) return "comment";
    if (stream.match(/\$[A-Za-z_][\w]*/)) return "variableName";
    if (stream.match(/"(?:\\.|[^"\\])*"/)) return "string";
    if (stream.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/)) return "number";
    if (stream.match(/\.\.\./)) return "punctuation";
    if (stream.match(/[{}():!,=@|\[\]]/)) return "punctuation";
    if (stream.match(/[A-Za-z_][\w]*/)) {
      const word = stream.current();
      if (["query", "mutation", "subscription", "fragment", "on"].includes(word)) return "keyword";
      if (["true", "false", "null"].includes(word)) return "atom";
      return "propertyName";
    }
    stream.next();
    return null;
  },
});

export default function GraphQLPage() {
  const [selected, setSelected] = useState<QueryExample | null>(QUERY_EXAMPLES[0]);
  const [query, setQuery] = useState(QUERY_EXAMPLES[0].query);
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHistory(loadQueryHistory()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateQuery(value: string) {
    setQuery(value);
    setSelected(null);
    setHistory(saveQueryToHistory(value));
  }

  // A run is only believed while it is the latest one: leaving the page, or
  // starting another run, cancels it rather than letting its answer land on a
  // result the user has moved on from.
  const scope = useAbortScope();

  async function runQuery() {
    const req = scope.next();
    setHistory(saveQueryToHistory(query));
    setRunning(true);
    setError(null);
    setUnavailable(false);
    try {
      const res = await fetch(PUBLIC_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: req.signal,
      });
      const body = await res.json();
      if (!req.isCurrent()) return;
      if (body.errors?.length) {
        setError(body.errors.map((e: { message: string }) => e.message).join("; "));
        setResult(null);
      } else {
        setResult(body.data);
      }
    } catch {
      if (!req.isCurrent()) return;
      setUnavailable(true);
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
    setUnavailable(false);
  }

  useEffect(() => {
    const reconnect = () => { if (unavailable) void runQuery(); };
    window.addEventListener("lumina:online", reconnect);
    return () => window.removeEventListener("lumina:online", reconnect);
  }, [unavailable, query]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">GraphQL Playground</h1>
      <div className="flex items-center gap-2.5 mb-7 flex-wrap">
        <p className="text-[var(--color-text-secondary)] text-[13px] m-0">Lumina GraphQL endpoint:</p>
        <span className="mono text-xs px-2.5 py-1 rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]">{PUBLIC_GRAPHQL_URL}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6" style={{ minHeight: "560px" }}>
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-wide uppercase text-[var(--color-text-muted)] mb-1">Query Examples</h2>
          {QUERY_EXAMPLES.map(ex => (
            <button key={ex.name} onClick={() => selectExample(ex)}
              className={`text-left rounded-[10px] p-3 border transition-colors ${selected?.name === ex.name ? "border-[var(--color-border-strong)] bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]" : "border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"}`}>
              <span className="block font-bold text-[13px] mb-0.5">{ex.name}</span>
              <span className="block text-[11px] opacity-70 leading-snug">{ex.description}</span>
            </button>
          ))}
          <h2 className="text-xs font-bold tracking-wide uppercase text-[var(--color-text-muted)] mt-4 mb-1">Recent Queries</h2>
          {history.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">Edited queries will appear here.</p>
          ) : history.map((entry, index) => (
            <button key={`${index}-${entry}`} onClick={() => { setQuery(entry); setSelected(null); setResult(null); setError(null); }}
              className="text-left rounded-[10px] p-3 border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]">
              <span className="block text-[11px] mono leading-snug line-clamp-3">{entry}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-border-default)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
              <span className="text-[11px] font-bold tracking-wide uppercase text-[var(--color-text-muted)]">Query Editor</span>
              <button onClick={runQuery} disabled={running} className="bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] disabled:opacity-50 text-white font-bold text-[13px] px-4 py-[7px] rounded-[7px] transition-colors">
                {running ? "Running…" : "Run Query"}
              </button>
            </div>
            <CodeMirror value={query} onChange={updateQuery} extensions={[graphqlLanguage]}
              basicSetup={{ bracketMatching: true, closeBrackets: true, lineNumbers: true, foldGutter: true }}
              className="graphql-editor min-h-[280px] text-[13px]" />
          </div>

          <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]"><span className="text-[11px] font-bold tracking-wide uppercase text-[var(--color-text-muted)]">Response</span></div>
            <div className="p-3.5 px-4 max-h-[260px] overflow-y-auto">
              {unavailable ? (
                <BackendUnavailable onRetry={runQuery} />
              ) : error ? (
                <span className="text-[var(--color-error-text)] text-sm">{error}</span>
              ) : result === null ? (
                <span className="text-[var(--color-text-muted)] text-sm">Click &ldquo;Run Query&rdquo; to see the response.</span>
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
