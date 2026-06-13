/**
 * `useMe()` + OIDC sign-in/out URL helpers — the small auth-status surface
 * every etamong-lab app reimplements.
 *
 * Pairs with `oauth2-proxy` (the fleet's standard auth proxy): the sign-in
 * URL is `/oauth2/start?rd=<return-url>`, sign-out is `/oauth2/sign_out`.
 *
 * The `/me` endpoint and the exact shape are app-specific, so the hook is
 * generic over the body type. Pass a `fetcher` (typically from
 * `createFetch`) and a type — the hook handles the loading/error/refresh
 * state machine + listens for an `etu:me-refresh` event so other
 * components can ask for a re-fetch.
 */

import { useCallback, useEffect, useState } from "react";

export interface BaseMe {
  /** Always present — the authenticated identity. */
  email: string;
  /** OIDC `preferred_username` if the IdP supplies it. */
  preferred_username?: string;
  /** Server-side admin flag (use this, not allowlist-by-email on the client). */
  is_admin?: boolean;
  /** Role claims from the IdP. */
  roles?: string[];
}

export interface UseMeOptions<T extends BaseMe> {
  /**
   * URL to fetch. Default: `/api/me`. Ignored when `fetcher` is set.
   */
  endpoint?: string;
  /**
   * Custom fetcher — usually the `api.get<T>("/me")` from your
   * `createFetch` client. Use this when the app's API is mounted under a
   * non-default base path or needs custom headers.
   */
  fetcher?: () => Promise<T>;
  /**
   * When `true` (default), 401 from the default fetcher counts as
   * "anonymous" rather than an error — `me` becomes `null`, `error`
   * stays `null`. Useful when the app has public surfaces. Ignored when
   * a custom `fetcher` is set.
   */
  treat401AsAnonymous?: boolean;
}

export interface UseMeResult<T extends BaseMe> {
  me: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-fetch /me. Also fires `etu:me-refresh` so other readers re-fetch too. */
  refresh: () => void;
}

const REFRESH_EVENT = "etu:me-refresh";

async function defaultFetcher<T>(endpoint: string, treat401: boolean): Promise<T | null> {
  if (typeof fetch === "undefined") throw new Error("useMe: no fetch impl available");
  const res = await fetch(endpoint, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (res.status === 401 && treat401) return null;
  if (!res.ok) throw new Error("useMe: " + res.status);
  return (await res.json()) as T;
}

export function useMe<T extends BaseMe = BaseMe>(
  opts: UseMeOptions<T> = {},
): UseMeResult<T> {
  const { endpoint = "/api/me", fetcher, treat401AsAnonymous = true } = opts;
  const [me, setMe] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = fetcher
        ? await fetcher()
        : await defaultFetcher<T>(endpoint, treat401AsAnonymous);
      setMe(value);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetcher, treat401AsAnonymous]);

  useEffect(() => {
    fetchMe();
    if (typeof window === "undefined") return;
    const onRefresh = () => fetchMe();
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [fetchMe]);

  const refresh = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(REFRESH_EVENT));
    } else {
      fetchMe();
    }
  }, [fetchMe]);

  return { me, loading, error, refresh };
}

function currentRd(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.search + window.location.hash;
}

/**
 * Build the oauth2-proxy sign-in URL. Pass `rd` to override the
 * post-sign-in redirect target (default: the current URL).
 */
export function signInUrl(rd?: string): string {
  return "/oauth2/start?rd=" + encodeURIComponent(rd ?? currentRd());
}

/**
 * Build the oauth2-proxy sign-out URL. Pass `rd` for the post-sign-out
 * redirect (default: `/`).
 */
export function signOutUrl(rd?: string): string {
  return "/oauth2/sign_out?rd=" + encodeURIComponent(rd ?? "/");
}

/** Navigate to the sign-in URL. */
export function signIn(rd?: string): void {
  if (typeof window !== "undefined") window.location.href = signInUrl(rd);
}

/** Navigate to the sign-out URL. */
export function signOut(rd?: string): void {
  if (typeof window !== "undefined") window.location.href = signOutUrl(rd);
}
