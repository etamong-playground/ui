import { useEffect, useRef, useState } from "react";
import { isInputTarget, shortcutKey } from "./keywords";

export interface GoToRoute {
  /** Second key after the "g" prefix (e.g. "s" for `g s`). */
  key: string;
  /** Destination passed to `onNavigate`. */
  href: string;
  /** Skipped unless `isAdmin`. */
  adminOnly?: boolean;
}

export interface GoToOptions {
  isAdmin?: boolean;
  /** How long the "g" prefix stays armed, ms. Default 1500. */
  timeoutMs?: number;
}

/**
 * Two-key "go-to" navigation: press `g`, then a letter within the timeout, to
 * jump. Korean-IME-safe (resolves the logical key via `shortcutKey`/`e.code`),
 * ignores text-entry targets, modifier combos, and key repeats.
 *
 * Returns the armed prefix ("g") or null — render it as a small indicator.
 *
 * @example
 *   const pending = useGoToShortcuts(
 *     [{ key: "h", href: "/" }, { key: "s", href: "/schedules" }],
 *     (href) => router.push(href),
 *     { isAdmin },
 *   );
 */
export function useGoToShortcuts(
  routes: GoToRoute[],
  onNavigate: (href: string) => void,
  options: GoToOptions = {},
): string | null {
  const { isAdmin = false, timeoutMs = 1500 } = options;
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Avoid re-subscribing the listener on every render; read live values via refs.
  const routesRef = useRef(routes);
  const navRef = useRef(onNavigate);
  const adminRef = useRef(isAdmin);
  routesRef.current = routes;
  navRef.current = onNavigate;
  adminRef.current = isAdmin;

  useEffect(() => {
    function clearPending() {
      clearTimeout(timerRef.current);
      pendingRef.current = null;
      setPending(null);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat || isInputTarget(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = shortcutKey(e);

      if (key === "g" && !e.shiftKey && !pendingRef.current) {
        e.preventDefault();
        pendingRef.current = "g";
        setPending("g");
        timerRef.current = setTimeout(clearPending, timeoutMs);
        return;
      }

      if (pendingRef.current === "g" && !e.shiftKey) {
        const route = routesRef.current.find((r) => r.key === key);
        if (route && (!route.adminOnly || adminRef.current)) {
          e.preventDefault();
          navRef.current(route.href);
        }
        clearPending();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [timeoutMs]);

  return pending;
}
