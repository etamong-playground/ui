import type { ReactNode } from "react";

/** A single command-palette entry. */
export interface CommandItem {
  /** Stable unique id (used as the React key). */
  id: string;
  /** Visible label in the active locale. */
  label: string;
  /** Right-aligned secondary text (e.g. a parent group name). */
  sublabel?: string;
  /**
   * The string cmdk filters on. To make search work across languages, build
   * this with `crossLocaleKeywords` so it contains the label in every locale.
   * Defaults to `label` when omitted.
   */
  keywords?: string;
  /** Leading icon — any node (lucide, inline SVG). Icon library stays the app's choice. */
  icon?: ReactNode;
  /** Navigation target; selecting calls `onNavigate(href)`. */
  href?: string;
  /** Action callback; selecting invokes it. Takes precedence over `href`. */
  onSelect?: () => void;
  /** Hidden unless the palette is rendered with `isAdmin`. */
  adminOnly?: boolean;
}

/** An ordered, headed group of items. */
export interface CommandSection {
  id: string;
  heading: string;
  items: CommandItem[];
  /** Keep the group mounted even with no text match (e.g. a "search for …" row). */
  forceMount?: boolean;
}

/** Overridable UI strings (defaults are English). */
export interface CommandPaletteLabels {
  placeholder: string;
  noResults: string;
}
