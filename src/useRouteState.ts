/**
 * Router-agnostic in-page state hooks for the SPA navigation/state contract
 * (planning concepts/spa-navigation-state).
 *
 * Two flavors:
 *
 * - `useRouteState(key, initial, opts?)` — backed by the URL query string.
 *   Use for state the user benefits from sharing or restoring after refresh:
 *   which tab is open, filter, sort, search term, expanded row id.
 *
 * - `useSessionState(key, initial, opts?)` — backed by `sessionStorage`,
 *   keyed by route. Use for truly local state you don't want in the URL:
 *   scroll position, cmdk query, unsubmitted form draft.
 *
 * Both hooks:
 *   - Hydrate from their backing store on mount.
 *   - Listen to `popstate` / `hashchange` so back/forward and direct URL
 *     edits stay in sync.
 *   - Are SSR-safe: on the server they just return `initial` until mount.
 *   - Don't assume a router; they read/write `window.history` directly.
 *
 * URL serialization defaults to `JSON.stringify` so booleans / numbers /
 * arrays round-trip. Pass `{ serialize, deserialize }` for a cleaner
 * representation when you want pretty URLs (e.g. tab names as plain
 * strings instead of `"overview"` with the quotes).
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Updater<T> = T | ((prev: T) => T);

export interface UseRouteStateOptions<T> {
  /** How to encode the value into the URL. Default: `JSON.stringify`. */
  serialize?: (value: T) => string;
  /** How to decode the URL value back. Default: `JSON.parse`. */
  deserialize?: (raw: string) => T;
  /**
   * Replace the entry instead of pushing a new one. Useful for noisy state
   * (search-as-you-type filter) that shouldn't fill the back history.
   * Default: `true` (replace).
   */
  replace?: boolean;
}

export interface UseSessionStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
  /**
   * Override the per-route scope. Default: `window.location.pathname +
   * window.location.hash` so each in-app view gets its own slot. Pass a
   * static string when you want the state to span routes.
   */
  scope?: string;
}

const defaultSerialize = <T,>(v: T) => JSON.stringify(v);
const defaultDeserialize = <T,>(raw: string): T => JSON.parse(raw) as T;

function readQueryParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  // Read from both the regular query and the hash query (hash routers).
  const search = new URLSearchParams(window.location.search);
  if (search.has(key)) return search.get(key);
  const hash = window.location.hash;
  const hq = hash.indexOf("?");
  if (hq >= 0) {
    const hashParams = new URLSearchParams(hash.slice(hq + 1));
    if (hashParams.has(key)) return hashParams.get(key);
  }
  return null;
}

function writeQueryParam(key: string, value: string | null, replace: boolean) {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  const hq = hash.indexOf("?");
  // Prefer the hash-query channel when the app is hash-routed and already
  // has hash params; otherwise write to the regular query.
  const useHashQuery = hash.startsWith("#") && hq >= 0;
  if (useHashQuery) {
    const base = hash.slice(0, hq);
    const params = new URLSearchParams(hash.slice(hq + 1));
    if (value === null) params.delete(key);
    else params.set(key, value);
    const next = params.toString();
    const newHash = next ? `${base}?${next}` : base;
    const url = window.location.pathname + window.location.search + newHash;
    apply(url, replace);
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (value === null) params.delete(key);
  else params.set(key, value);
  const next = params.toString();
  const url =
    window.location.pathname +
    (next ? "?" + next : "") +
    window.location.hash;
  apply(url, replace);
}

function apply(url: string, replace: boolean) {
  if (replace) window.history.replaceState(window.history.state, "", url);
  else window.history.pushState(null, "", url);
  // Notify our own listeners — pushState/replaceState don't fire popstate.
  window.dispatchEvent(new Event("etu:route-state"));
}

export function useRouteState<T>(
  key: string,
  initial: T,
  opts: UseRouteStateOptions<T> = {},
): [T, (next: Updater<T>) => void] {
  const serialize = opts.serialize ?? defaultSerialize;
  const deserialize = opts.deserialize ?? defaultDeserialize;
  const replace = opts.replace ?? true;

  const read = useCallback((): T => {
    const raw = readQueryParam(key);
    if (raw === null) return initial;
    try {
      return deserialize(raw);
    } catch {
      return initial;
    }
  }, [key, initial, deserialize]);

  const [value, setLocal] = useState<T>(read);

  // Re-sync from the URL on mount and on browser navigation.
  useEffect(() => {
    setLocal(read());
    const onChange = () => setLocal(read());
    window.addEventListener("popstate", onChange);
    window.addEventListener("hashchange", onChange);
    window.addEventListener("etu:route-state", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("etu:route-state", onChange);
    };
  }, [read]);

  const set = useCallback(
    (next: Updater<T>) => {
      setLocal((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          writeQueryParam(key, serialize(resolved), replace);
        } catch {
          // If serialize throws, fall back to no-op on the URL but still
          // update React state so the UI doesn't get stuck.
        }
        return resolved;
      });
    },
    [key, serialize, replace],
  );

  return [value, set];
}

export function useSessionState<T>(
  key: string,
  initial: T,
  opts: UseSessionStateOptions<T> = {},
): [T, (next: Updater<T>) => void] {
  const serialize = opts.serialize ?? defaultSerialize;
  const deserialize = opts.deserialize ?? defaultDeserialize;
  const scopeRef = useRef(opts.scope);
  scopeRef.current = opts.scope;

  const storageKey = useCallback(() => {
    const scope =
      scopeRef.current ??
      (typeof window !== "undefined"
        ? window.location.pathname + window.location.hash
        : "");
    return `etu:ss:${scope}::${key}`;
  }, [key]);

  const read = useCallback((): T => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.sessionStorage.getItem(storageKey());
      if (raw === null) return initial;
      return deserialize(raw);
    } catch {
      return initial;
    }
  }, [initial, deserialize, storageKey]);

  const [value, setLocal] = useState<T>(read);

  useEffect(() => {
    setLocal(read());
    const onNav = () => setLocal(read());
    // Re-key when the in-app route changes (default scope is route-based).
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    window.addEventListener("etu:route-state", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
      window.removeEventListener("etu:route-state", onNav);
    };
  }, [read]);

  const set = useCallback(
    (next: Updater<T>) => {
      setLocal((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.sessionStorage.setItem(storageKey(), serialize(resolved));
        } catch {
          // Quota / private-mode failures: keep React state, drop persistence.
        }
        return resolved;
      });
    },
    [storageKey, serialize],
  );

  return [value, set];
}
