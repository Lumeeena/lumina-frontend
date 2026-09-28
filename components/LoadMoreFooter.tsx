/**
 * The footer shared by the account page's paginated lists — the same
 * Load more / retry / end-of-results pattern the explorer uses, so the two
 * lists on one page do not end up with two opinions about what "more" looks
 * like.
 */
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export interface LoadMoreFooterProps {
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  /** Rendered, muted, when the list is complete — the explorer's "End of results". */
  endLabel: string;
  onLoadMore: () => void;
}

export default function LoadMoreFooter({
  loading,
  error,
  hasMore,
  endLabel,
  onLoadMore,
}: LoadMoreFooterProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center gap-3 mt-4">
        <span className="text-[13px] text-[var(--color-error-text)]">{error}</span>
        <Button variant="secondary" size="sm" onClick={onLoadMore}>
          {t("loadMore.retry")}
        </Button>
      </div>
    );
  }

  if (hasMore) {
    return (
      <div className="flex items-center justify-center mt-4">
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          loadingText={t("loadMore.loading")}
          onClick={onLoadMore}
        >
          {t("loadMore.loadMore")}
        </Button>
      </div>
    );
  }

  return (
    <p className="text-[13px] text-[var(--color-text-muted)] text-center mt-4">
      {endLabel}
    </p>
  );
}
