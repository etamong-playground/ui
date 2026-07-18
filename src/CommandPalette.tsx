import { useCallback, useEffect, useState } from "react";
import { Command, defaultFilter } from "cmdk";
import type {
  CommandItem,
  CommandPaletteLabels,
  CommandSearchAction,
  CommandSection,
} from "./types";
import {
  COMMAND_PALETTE_OPEN_EVENT,
  isInputTarget,
  koreanMatch,
  shortcutKey,
} from "./keywords";

/**
 * Layer ko choseong matching on top of cmdk's own scorer. Keep cmdk's score —
 * and therefore its ranking — for every value it already matches, and add only
 * what it structurally cannot: Korean initial-consonant hits like "ㅍㄹㅈㅌ" →
 * "프로젝트" (which cmdk misses because the jamo aren't literal substrings). The
 * result set is a superset of cmdk's default; Latin and full-word ranking are
 * left exactly as cmdk produced them.
 */
// Exported for unit testing only — not re-exported from the package barrel
// (index.ts), so it stays out of the published API surface.
export function paletteFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const base = defaultFilter(value, search, keywords);
  return base > 0 ? base : koreanMatch(search, value) ? 1 : 0;
}

export interface CommandPaletteProps {
  /** Ordered groups rendered top-to-bottom. */
  sections: CommandSection[];
  /** Always-mounted "search for …" actions, rendered last; receive the live query. */
  searchActions?: CommandSearchAction[];
  /** Called with an item's `href` on select (e.g. `router.push`). */
  onNavigate?: (href: string) => void;
  /** When false, items marked `adminOnly` are filtered out. Default false. */
  isAdmin?: boolean;
  /** Override the input placeholder / empty-state text. */
  labels?: Partial<CommandPaletteLabels>;
  /** Also open on "/" (ignored inside inputs). Default true. */
  openOnSlash?: boolean;
  /** Controlled open state. Omit to let the palette own it (⌘K / "/" / event). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_LABELS: CommandPaletteLabels = {
  placeholder: "Type a command or search…",
  noResults: "No results.",
  searchHeading: "Search",
};

/**
 * A configurable ⌘K command palette built on cmdk and styled from the
 * @etamong-playground/ui tokens (import "@etamong-playground/ui/styles.css"). Mount it once,
 * globally, when the user is authenticated.
 *
 * Opens on ⌘K / Ctrl+K, on "/" (unless typing), and on the
 * `command-palette:open` DOM event. Search filters on each item's `keywords`
 * (build them with `crossLocaleKeywords` for cross-language matching); Korean
 * choseong queries match too, so typing "ㅍㄹㅈㅌ" finds "프로젝트".
 */
export function CommandPalette({
  sections,
  searchActions,
  onNavigate,
  isAdmin = false,
  labels,
  openOnSlash = true,
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [search, setSearch] = useState("");
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const text = { ...DEFAULT_LABELS, ...labels };

  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) setSearch("");
      if (isControlled) onOpenChange?.(next);
      else setUncontrolledOpen(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const key = shortcutKey(e);
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        setOpen(!open);
        return;
      }
      if (
        openOnSlash &&
        key === "/" &&
        !e.shiftKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isInputTarget(e)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
    };
  }, [open, openOnSlash, setOpen]);

  const select = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      if (item.onSelect) item.onSelect();
      else if (item.href) onNavigate?.(item.href);
    },
    [onNavigate, setOpen],
  );

  const runSearch = useCallback(
    (action: CommandSearchAction) => {
      setOpen(false);
      action.run(search.trim());
    },
    [search, setOpen],
  );

  const visibleSections = sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.adminOnly || isAdmin),
    }))
    .filter((s) => s.forceMount || s.items.length > 0);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="etu-cmdk"
      overlayClassName="etu-cmdk-overlay"
      contentClassName="etu-cmdk-content"
      shouldFilter
      filter={paletteFilter}
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder={text.placeholder}
        className="etu-cmdk-input"
        autoFocus
      />
      <Command.List className="etu-cmdk-list">
        <Command.Empty className="etu-cmdk-empty">{text.noResults}</Command.Empty>
        {visibleSections.map((section) => (
          <Command.Group
            key={section.id}
            heading={section.heading}
            forceMount={section.forceMount}
          >
            {section.items.map((item) => (
              <Command.Item
                key={item.id}
                value={item.keywords || item.label}
                onSelect={() => select(item)}
                className="etu-cmdk-item"
              >
                {item.icon ? (
                  <span className="etu-cmdk-item-icon">{item.icon}</span>
                ) : null}
                <span className="etu-cmdk-item-label">{item.label}</span>
                {item.sublabel ? (
                  <span className="etu-cmdk-item-sub">{item.sublabel}</span>
                ) : null}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
        {searchActions && searchActions.length > 0 ? (
          <Command.Group
            heading={text.searchHeading}
            forceMount
            className="etu-cmdk-search"
          >
            {searchActions.map((action) => (
              <Command.Item
                key={action.id}
                value={`__search__ ${action.keywords || action.label}`}
                onSelect={() => runSearch(action)}
                className="etu-cmdk-item etu-cmdk-item-search"
              >
                {action.icon ? (
                  <span className="etu-cmdk-item-icon">{action.icon}</span>
                ) : null}
                <span className="etu-cmdk-item-label">{action.label}</span>
                {search.trim() ? (
                  <span className="etu-cmdk-item-sub">&quot;{search.trim()}&quot;</span>
                ) : null}
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
      <div className="etu-cmdk-footer">
        <kbd className="etu-cmdk-kbd">↑↓</kbd>
        <kbd className="etu-cmdk-kbd">↵</kbd>
        <kbd className="etu-cmdk-kbd">esc</kbd>
      </div>
    </Command.Dialog>
  );
}
