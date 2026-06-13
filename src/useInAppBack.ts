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
 *     runs the optional `onExit` handler (e.g. router.push("/")) so the
 *     UI button still does something sensible on a cold entry.
 *
 * Composes cleanly with `useRouteState`: that hook uses `replaceState`,
 * so URL-synced in-page state (tab, filter) doesn't grow the back stack
 * and doesn't confuse the depth counter.
 *
 * The hook is router-agnostic — it reads and writes `window.history`
 * directly. Pair it with whatever you use for routing.
 */

import { useCallback, useEffect, useState } from "react";

export interface UseInAppBackResult {
  /** True when there's at least one in-app entry behind the current one. */
  canGoBack: boolean;
  /**
   * Go to the previous in-app view. When `canGoBack` is false, calls the
   * `onExit` handler passed to the hook (no-op if none).
   */
  goBack: () => void;
  /** Push a new in-app entry (URL + depth increment). */
  push: (url: string) => void;
  /** Replace the current entry without growing the stack. */
  replace: (url: string) => void;
}

export interface UseInAppBackOptions {
  /**
   * Where to go when the user clicks "back" but there's no in-app history
   * behind them (cold entry from an external link, or after the browser
   * dropped the state on reload). Common choices: navigate to `"/"`, or
   * leave undefined to render nothing.
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

export function useInAppBack(opts: UseInAppBackOptions = {}): UseInAppBackResult {
  const { onExit } = opts;
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
    } else if (onExit) {
      onExit();
    }
  }, [onExit]);

  return { canGoBack: depth > 0, goBack, push, replace };
}
