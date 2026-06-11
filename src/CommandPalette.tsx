import { useCallback, useEffect, useState } from "react";
import { Command } from "cmdk";
import type { CommandItem, CommandPaletteLabels, CommandSection } from "./types";
import {
  COMMAND_PALETTE_OPEN_EVENT,
  isInputTarget,
  shortcutKey,
} from "./keywords";

export interface CommandPaletteProps {
  /** Ordered groups rendered top-to-bottom. */
  sections: CommandSection[];
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
};

/**
 * A configurable ⌘K command palette built on cmdk and styled from the
 * @etamong-lab/ui tokens (import "@etamong-lab/ui/styles.css"). Mount it once,
 * globally, when the user is authenticated.
 *
 * Opens on ⌘K / Ctrl+K, on "/" (unless typing), and on the
 * `command-palette:open` DOM event. Search filters on each item's `keywords`
 * (build them with `crossLocaleKeywords` for cross-language matching).
 */
export function CommandPalette({
  sections,
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
      </Command.List>
      <div className="etu-cmdk-footer">
        <kbd className="etu-cmdk-kbd">↑↓</kbd>
        <kbd className="etu-cmdk-kbd">↵</kbd>
        <kbd className="etu-cmdk-kbd">esc</kbd>
      </div>
    </Command.Dialog>
  );
}
