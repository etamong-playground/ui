/**
 * Theme helpers for the `[data-theme]` mechanism that styles.css implements.
 *
 * `data-theme` must be set on <html> BEFORE first paint, or the page flashes the
 * default (light) theme before flipping to the user's choice. Inject
 * `noFlashThemeScript` synchronously in <head> — for Next, in a <script
 * dangerouslySetInnerHTML>; for a Vite app, inline in index.html.
 */

export type Theme = "light" | "dark";

/** Build the storage key for an app (so two apps don't share a theme choice). */
function storageKey(appKey: string): string {
  return `${appKey}-theme`;
}

/**
 * A self-contained <head> snippet (no deps) that sets `data-theme` from the
 * saved choice, falling back to the OS preference. Pass the same `appKey` you
 * pass to `getTheme`/`setTheme`.
 */
export function noFlashThemeScript(appKey: string): string {
  return `(function(){try{var k=${JSON.stringify(storageKey(appKey))};var s=localStorage.getItem(k);var d=s||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",d);}catch(e){}})();`;
}

/** Read the active theme (saved choice → OS preference → light). */
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
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
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
