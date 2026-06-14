/**
 * Theme helpers for the `[data-theme]` mechanism that styles.css implements.
 *
 * `data-theme` must be set on <html> BEFORE first paint, or the page flashes
 * the default theme before flipping to the user's choice. Inject
 * `noFlashThemeScript` synchronously in <head> — for Next, in a <script
 * dangerouslySetInnerHTML>; for a Vite app, inline in index.html.
 *
 * Resolution order (matches the fleet rule in
 * planning/wiki/concepts/theme-system-dark-fallback.md):
 *
 *   1. saved user choice in localStorage
 *   2. OS preference via `prefers-color-scheme`
 *   3. dark — the fleet-wide fallback when we can't tell
 *
 * Prior to v0.28 the fallback was "light"; the fleet now treats dark as
 * the audience-of-record default (most surfaces are dark; designs assume
 * dark first).
 */

export type Theme = "light" | "dark";

/** Build the storage key for an app (so two apps don't share a theme choice). */
function storageKey(appKey: string): string {
  return `${appKey}-theme`;
}

/**
 * A self-contained <head> snippet (no deps) that sets `data-theme` from the
 * saved choice, falling back to the OS preference, then dark. Pass the same
 * `appKey` you pass to `getTheme`/`setTheme`.
 */
export function noFlashThemeScript(appKey: string): string {
  return `(function(){try{var k=${JSON.stringify(storageKey(appKey))};var s=localStorage.getItem(k);var d=s;if(d!=="light"&&d!=="dark"){d=(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark";}document.documentElement.setAttribute("data-theme",d);}catch(e){}})();`;
}

/** Read the active theme (saved choice → OS preference → dark). */
export function getTheme(appKey: string): Theme {
  try {
    const saved = localStorage.getItem(storageKey(appKey));
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable */
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }
  return "dark";
}

/** Persist and apply a theme to <html>. */
export function setTheme(appKey: string, theme: Theme): void {
  try {
    localStorage.setItem(storageKey(appKey), theme);
  } catch {
    /* storage unavailable */
  }
  document.documentElement.setAttribute("data-theme", theme);
}
