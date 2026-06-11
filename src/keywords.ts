/**
 * Concatenate one label across every locale dictionary so cmdk search matches
 * regardless of the active language — a Korean user typing an English term (or
 * vice-versa) still finds the item. This is mandatory in a ko-first ecosystem.
 *
 * @example
 *   import ko from "./locales/ko";
 *   import en from "./locales/en";
 *   const dicts = [ko, en];
 *   crossLocaleKeywords(dicts, (d) => d.nav.schedules) // "일정 Schedules"
 */
export function crossLocaleKeywords<D>(
  dicts: readonly D[],
  getter: (dict: D) => string,
): string {
  return dicts
    .map(getter)
    .filter(Boolean)
    .join(" ");
}

/** True when the keyboard event originates from a text-entry control. */
export function isInputTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  );
}

/**
 * Map physical key codes to logical keys so shortcuts survive a Korean IME:
 * when an IME is active `e.key` is a Hangul syllable, not the Latin letter, so
 * single-letter shortcuts must fall back to `e.code`.
 */
export const CODE_TO_KEY: Readonly<Record<string, string>> = {
  Slash: "/",
  KeyG: "g",
  KeyH: "h",
  KeyK: "k",
  KeyS: "s",
  KeyN: "n",
  KeyT: "t",
  KeyM: "m",
  KeyP: "p",
};

/**
 * Resolve the logical shortcut key for an event. Prefers `e.key` when it is
 * already an ASCII shortcut (`/`, `?`, or a–z); otherwise falls back to the
 * physical-code map (covers IME output).
 */
export function shortcutKey(e: KeyboardEvent): string {
  const isAscii = e.key === "/" || e.key === "?" || /^[a-z]$/.test(e.key);
  return isAscii ? e.key : (CODE_TO_KEY[e.code] ?? e.key);
}

/** The custom DOM event any UI affordance can dispatch to open the palette. */
export const COMMAND_PALETTE_OPEN_EVENT = "command-palette:open";

/** Dispatch `command-palette:open` so a button/menu can open the palette. */
export function openCommandPalette(): void {
  document.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
}
