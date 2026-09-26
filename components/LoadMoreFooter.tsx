/**
 * The footer shared by the account page's paginated lists — the same
 * Load more / retry / end-of-results pattern the explorer uses, so the two
 * lists on one page do not end up with two opinions about what "more" looks
 * like.
 */
export interface LoadMoreFooterProps {
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  /** Rendered, muted, when the list is complete — the explorer's "End of results". */
  endLabel: string;
  onLoadMore: () => void;
}

export default function LoadMoreFooter({ loading, error, hasMore, endLabel, onLoadMore }: LoadMoreFooterProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center gap-3 mt-4">
        <span className="text-[13px] text-[#dc2626]">{error}</span>
        <button
          onClick={onLoadMore}
          className="bg-[#f6f5f8] border border-[#e5e3ea] hover:border-[#c4b5fd] font-semibold text-[13px] px-4 py-2 rounded-[9px] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (hasMore) {
    return (
      <div className="flex items-center justify-center mt-4">
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="bg-[#f6f5f8] border border-[#e5e3ea] enabled:hover:border-[#c4b5fd] disabled:opacity-50 font-semibold text-[13px] px-5 py-2 rounded-[9px] transition-colors"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      </div>
    );
  }

  return <p className="text-[13px] text-[#c3c1cb] text-center mt-4">{endLabel}</p>;
}
