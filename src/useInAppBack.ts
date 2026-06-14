/**
 * In-app history stack for the SPA navigation contract Rule 2
 * (planning concepts/spa-navigation-state): the browser back button — and
 * any in-UI "back" button — should stay inside the app instead of bouncing
 * the user out to whatever site they came from.
 *
 * How it works:
 *   - Every in-app navigation goes through `push(url)` / `replace(url)`,
 *     which writes a marker into `history.state` (`{ etuInApp: true,
 *     etuDepth: N }`).
 *   - `canGoBack` is true when the current entry has `etuDepth > 0` — i.e.
 *     there's at least one in-app entry behind us.
 *   - `goBack()` calls `history.back()` when `canGoBack`; otherwise it
 *     runs the `fallback` handler (e.g. router.push("/more")) so the UI
 *     button still does something sensible on a cold entry.
 *
 * Composes cleanly with `useRouteState`: that hook uses `replaceState`,
 * so URL-synced in-page state (tab, filter) doesn't grow the back stack
 * and doesn't confuse the depth counter.
 *
 * The hook is router-agnostic — it reads and writes `window.history`
 * directly. Pair it with whatever you use for routing.
 *
 * Most consumers should just render `<BackButton fallback="/more" />` —
 * BackButton mounts this hook internally so apps don't have to plumb the
 * canGoBack/goBack split themselves. The standalone hook is exposed for
 * apps that need the values somewhere besides the button (e.g. a swipe
 * gesture, a keyboard shortcut, a custom layout).
 */

import { useCallback, useEffect, useState } from "react";

export interface UseInAppBackResult {
  /** True when there's at least one in-app entry behind the current one. */
  canGoBack: boolean;
  /**
   * Go to the previous in-app view. When `canGoBack` is false, runs the
   * `fallback` passed to the hook (or `onExit` for legacy callers; no-op
   * if neither is set).
   */
  goBack: () => void;
  /** Push a new in-app entry (URL + depth increment). */
  push: (url: string) => void;
  /** Replace the current entry without growing the stack. */
  replace: (url: string) => void;
}

/**
 * Where to go when the user clicks "back" but there's no in-app history
 * behind them (cold entry from an external link, or after the browser
 * dropped the state on reload).
 *
 * - **string** — treated as a URL. Calls `history.pushState(null, "", url)`
 *   and dispatches a synthetic `popstate` so hash/path routers re-render.
 *   Use for hash-routed apps and other vanilla setups.
 * - **function** — called as-is. Use for Next.js / React Router etc:
 *   `fallback={() => router.push("/more")}`.
 */
export type InAppBackFallback = string | (() => void);

export interface UseInAppBackOptions {
  /**
   * Where to go when `canGoBack` is false. Accepts a URL string or a
   * callback (most consumers want the callback when they already have a
   * router instance).
   */
  fallback?: InAppBackFallback;
  /**
   * @deprecated since v0.27.0 — use `fallback`. Kept for back-compat with
   * v0.8.0–v0.26.0 callers; behaves identically when `fallback` is unset.
   */
  onExit?: () => void;
}

interface InAppState {
  etuInApp?: boolean;
  etuDepth?: number;
}

function currentDepth(): number {
  if (typeof window === "undefined") return 0;
  const s = (window.history.state ?? {}) as InAppState;
  return s.etuInApp ? s.etuDepth ?? 0 : 0;
}

function writeEntry(url: string, depth: number, replace: boolean) {
  if (typeof window === "undefined") return;
  const next: InAppState = { etuInApp: true, etuDepth: depth };
  if (replace) window.history.replaceState(next, "", url);
  else window.history.pushState(next, "", url);
  // Our own listeners — pushState/replaceState don't fire popstate.
  window.dispatchEvent(new Event("etu:in-app-nav"));
}

/**
 * Runs a fallback. String fallbacks pushState + fire popstate so the
 * caller's router picks up the URL change without a full reload.
 */
export function runInAppBackFallback(fallback: InAppBackFallback): void {
  if (typeof window === "undefined") return;
  if (typeof fallback === "function") {
    fallback();
    return;
  }
  window.history.pushState(null, "", fallback);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useInAppBack(opts: UseInAppBackOptions = {}): UseInAppBackResult {
  const { fallback, onExit } = opts;
  const [depth, setDepth] = useState<number>(() => currentDepth());

  useEffect(() => {
    // On mount, mark the current entry as in-app if it isn't yet — so that
    // subsequent push() calls have a baseline to count from. This also
    // makes the hook safe to mount from anywhere; it won't reset depth on
    // routes the user navigated into earlier.
    if (typeof window === "undefined") return;
    const s = (window.history.state ?? {}) as InAppState;
    if (!s.etuInApp) {
      window.history.replaceState(
        { ...s, etuInApp: true, etuDepth: 0 },
        "",
        window.location.href,
      );
    }
    const sync = () => setDepth(currentDepth());
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("etu:in-app-nav", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("etu:in-app-nav", sync);
    };
  }, []);

  const push = useCallback((url: string) => {
    writeEntry(url, currentDepth() + 1, false);
  }, []);

  const replace = useCallback((url: string) => {
    writeEntry(url, currentDepth(), true);
  }, []);

  const goBack = useCallback(() => {
    if (currentDepth() > 0) {
      window.history.back();
      return;
    }
    if (fallback !== undefined) {
      runInAppBackFallback(fallback);
      return;
    }
    if (onExit) onExit();
  }, [fallback, onExit]);

  return { canGoBack: depth > 0, goBack, push, replace };
}
