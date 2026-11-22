"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { NAV_ROUTES } from "@/lib/routes";
import { isEditableTarget } from "@/lib/shortcuts";
import { Dialog } from "@/components/ui/Dialog";
import { t, type MessageKey } from "@/lib/i18n";

const ROUTE_MESSAGE_KEYS: Record<
  string,
  { label: MessageKey; description: MessageKey }
> = {
  "/explorer": {
    label: "commandPalette.route.explorer.label",
    description: "commandPalette.route.explorer.description",
  },
  "/transactions": {
    label: "commandPalette.route.transactions.label",
    description: "commandPalette.route.transactions.description",
  },
  "/ledgers": {
    label: "commandPalette.route.ledgers.label",
    description: "commandPalette.route.ledgers.description",
  },
  "/search": {
    label: "commandPalette.route.search.label",
    description: "commandPalette.route.search.description",
  },
  "/events": {
    label: "commandPalette.route.events.label",
    description: "commandPalette.route.events.description",
  },
  "/assets": {
    label: "commandPalette.route.assets.label",
    description: "commandPalette.route.assets.description",
  },
  "/graphql": {
    label: "commandPalette.route.graphql.label",
    description: "commandPalette.route.graphql.description",
  },
  "/developers": {
    label: "commandPalette.route.developers.label",
    description: "commandPalette.route.developers.description",
  },
  "/registry": {
    label: "commandPalette.route.registry.label",
    description: "commandPalette.route.registry.description",
  },
  "/stats": {
    label: "commandPalette.route.stats.label",
    description: "commandPalette.route.stats.description",
  },
  "/watch": {
    label: "commandPalette.route.watch.label",
    description: "commandPalette.route.watch.description",
  },
};

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
  const triggerRef = useRef<HTMLElement | null>(null);

  const items: PaletteItem[] = [
    {
      id: "search",
      label: t("commandPalette.searchAction"),
      description: t("commandPalette.searchActionDescription"),
      icon: <Search className="w-4 h-4" />,
      onSelect: () => {
        router.push("/search");
        setOpen(false);
      },
      category: "action",
    },
    ...NAV_ROUTES.map((route) => {
      const keys = ROUTE_MESSAGE_KEYS[route.path];
      return {
        id: route.path,
        label: keys ? t(keys.label) : route.label,
        description: keys ? t(keys.description) : route.description,
        onSelect: () => {
          router.push(route.path);
          setOpen(false);
        },
        category: "route" as const,
      };
    }),
  ];

  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()),
  );

  const handleOpen = useCallback(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
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
            prev < filteredItems.length - 1 ? prev + 1 : prev,
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
    [filteredItems.length, handleClose, handleSelect],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset highlight when the query changes
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const selected = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`,
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
    <Dialog
      open={open}
      onClose={handleClose}
      title=""
      hideHeader
      className="max-w-2xl bg-[var(--color-bg-base)] rounded-lg border border-[var(--color-border-default)] shadow-lg overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-default)]">
        <Search className="w-5 h-5 text-[var(--color-text-secondary)]" />
        <input
          ref={inputRef}
          id="palette-input"
          type="text"
          placeholder={t("commandPalette.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-controls="palette-list"
          className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none"
        />
        <span className="text-xs text-[var(--color-text-secondary)]">ESC</span>
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
                  <div className="font-medium text-sm">{item.label}</div>
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
          <p className="text-sm">{t("commandPalette.noResults")}</p>
        </div>
      )}

      <div className="px-4 py-3 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-tertiary)]">
        <div className="flex justify-between">
          <span>⏎ {t("commandPalette.selectHint")}</span>
          <span>↑↓ {t("commandPalette.navigateHint")}</span>
        </div>
      </div>
    </Dialog>
  );
}
