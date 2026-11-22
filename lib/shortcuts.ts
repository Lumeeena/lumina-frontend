/**
 * Keyboard shortcuts for navigation.
 *
 * Routes use a two-key `g` then letter sequence so a single letter never fires
 * on its own, and nothing here uses a modifier: Ctrl/Cmd/Alt combinations belong
 * to the browser, the OS and assistive technology.
 */
import type { MessageKey } from "@/lib/i18n/types";

export interface RouteShortcut {
  key: string;
  href: string;
  /** Catalogue key for the page name shown in the help dialog. */
  labelKey: MessageKey;
}

export const GO_KEY = "g";
/** How long the second key of a sequence may lag the first. */
export const SEQUENCE_TIMEOUT_MS = 1000;

export const ROUTE_SHORTCUTS: RouteShortcut[] = [
  { key: "h", href: "/", labelKey: "shortcuts.route.home" },
  { key: "e", href: "/explorer", labelKey: "shortcuts.route.explorer" },
  { key: "t", href: "/transactions", labelKey: "shortcuts.route.transactions" },
  { key: "c", href: "/events", labelKey: "shortcuts.route.events" },
  { key: "q", href: "/graphql", labelKey: "shortcuts.route.graphql" },
  { key: "r", href: "/registry", labelKey: "shortcuts.route.registry" },
  { key: "s", href: "/stats", labelKey: "shortcuts.route.stats" },
];

export const SEARCH_KEY = "/";
export const HELP_KEY = "?";

export const SHORTCUTS_STORAGE_KEY = "lumina.keyboardShortcuts";

/** Typing into a field must never trigger navigation. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
  const role = target.getAttribute("role");
  return role === "textbox" || role === "combobox" || role === "searchbox";
}

/** Whether a keydown is one this module may act on at all. */
export function isPlainKey(e: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "repeat" | "defaultPrevented" | "target">): boolean {
  return !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat && !e.defaultPrevented && !isEditableTarget(e.target);
}
