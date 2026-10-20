"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { NAV_ROUTES, HOME } from "@/lib/routes";
import { isEditableTarget } from "@/lib/shortcuts";

export interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  category: "route" | "action";
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const items: PaletteItem[] = [
    {
      id: "search",
      label: "Search",
      description: "Search Stellar addresses and transactions",
      icon: <Search className="w-4 h-4" />,
      onSelect: () => {
        router.push("/search");
        setOpen(false);
      },
      category: "action",
    },
    ...NAV_ROUTES.map((route) => ({
      id: route.path,
      label: route.label,
      description: route.description,
      onSelect: () => {
        router.push(route.path);
        setOpen(false);
      },
      category: "route" as const,
    })),
  ];

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description?.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = useCallback(() => {
    opener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    opener.current?.focus();
  }, []);

  const handleSelect = useCallback(() => {
    if (filteredItems[selectedIndex]) {
      filteredItems[selectedIndex].onSelect();
    }
  }, [filteredItems, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          handleSelect();
          break;
      }
    },
    [filteredItems.length, handleClose, handleSelect]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const selected = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "k" &&
        !isEditableTarget(e.target)
      ) {
        e.preventDefault();
        handleOpen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleOpen]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center pt-16 bg-black/40"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[var(--color-bg-base)] rounded-lg border border-[var(--color-border-default)] shadow-lg overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="palette-input"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-default)]">
              <Search className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <input
                ref={inputRef}
                id="palette-input"
                type="text"
                placeholder="Search routes and actions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-autocomplete="list"
                aria-controls="palette-list"
                aria-expanded={open}
                className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none"
              />
              <span className="text-xs text-[var(--color-text-secondary)]">
                ESC
              </span>
            </div>

            {filteredItems.length > 0 ? (
              <div
                ref={listRef}
                id="palette-list"
                role="listbox"
                className="max-h-96 overflow-y-auto"
              >
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={handleSelect}
                    onMouseEnter={() => setSelectedIndex(index)}
                    role="option"
                    aria-selected={selectedIndex === index}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${
                      selectedIndex === index
                        ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.icon && (
                        <div className="text-[var(--color-text-secondary)] flex-shrink-0">
                          {item.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="text-xs text-[var(--color-text-secondary)] truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                <p className="text-sm">No results found</p>
              </div>
            )}

            <div className="px-4 py-3 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-tertiary)]">
              <div className="flex justify-between">
                <span>⏎ Select</span>
                <span>↑↓ Navigate</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
