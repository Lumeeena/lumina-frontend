"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Trash2 } from "lucide-react";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
  removeRecentlyViewed,
  type ViewedEntity,
} from "@/lib/recentlyViewed";

interface Props {
  limit?: number;
  compact?: boolean;
}

export default function RecentlyViewed({ limit = 5, compact = false }: Props) {
  const [items, setItems] = useState<ViewedEntity[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(getRecentlyViewed(limit));
    setMounted(true);
  }, [limit]);

  const handleRemove = (id: string, type: string) => {
    removeRecentlyViewed(id, type as any);
    setItems((prev) => prev.filter((item) => !(item.id === id && item.type === type as any)));
  };

  const handleClear = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  if (!mounted || items.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <History className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Recently Viewed
          </h3>
        </div>
        {items.map((item) => (
          <Link
            key={`${item.type}:${item.id}`}
            href={item.path}
            className="block px-3 py-2 text-sm text-[var(--color-accent-text)] hover:bg-[var(--color-bg-elevated)] rounded transition-colors truncate"
            title={item.label}
          >
            {item.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
          <History className="w-4 h-4" />
          Recently Viewed
        </h3>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          title="Clear recently viewed"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <Link
            key={`${item.type}:${item.id}`}
            href={item.path}
            className="group relative flex items-center gap-2 p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:border-[var(--color-accent-border)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                {item.type}
              </div>
              <div className="text-sm font-semibold text-[var(--color-accent-text)] truncate">
                {item.label}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleRemove(item.id, item.type);
              }}
              className="p-1 opacity-0 group-hover:opacity-100 text-[var(--color-text-secondary)] hover:text-red-600 transition-all"
              title="Remove from recently viewed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
