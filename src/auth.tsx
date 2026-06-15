/**
 * Fleet-auth primitives — implements the route contract documented at
 * `planning/wiki/concepts/fleet-auth.md` (planning#252).
 *
 *   GET /auth/login?rd=<path>      OIDC authorization
 *   GET /auth/callback              token exchange + session cookie
 *   GET /auth/logout                clear session
 *   GET /api/me                     { sub, email, name, groups }
 *
 * Apps still on the older `oauth2-proxy` paths (`/oauth2/start`,
 * `/oauth2/sign_out`) use `useMe()` / `signInUrl()` / `signOutUrl()`
 * from `./useMe` directly — those keep their legacy default. This
 * module is the forward path that fleet apps standardise on.
 */

import { useCallback, useEffect, useState } from "react";
import { useMe, type BaseMe, type UseMeOptions, type UseMeResult } from "./useMe";

const FLEET_LOGIN = "/auth/login";
const FLEET_LOGOUT = "/auth/logout";
const FLEET_ME = "/api/me";

const REFRESH_EVENT = "etu:me-refresh";
const SESSION_EXPIRED_EVENT = "etu:session-expired";

// Substrings (lowercase, case-insensitive match) of link-unfurl crawler
// User-Agents. Mirrors `isShareCrawler` in `shared/libs/auth-go` and
// `apps/pages/apiserver/main.go` — the same list everywhere.
export const SHARE_CRAWLER_UA_SUBSTRINGS = [
  "kakaotalk-scrap",
  "slackbot",
  "facebookexternalhit",
  "twitterbot",
  "discordbot",
  "linkedinbot",
  "telegrambot",
  "whatsapp",
  "line-poker",
] as const;

/** Returns true if `ua` matches any advertised share-preview crawler. */
export function isShareCrawler(ua: string | null | undefined): boolean {
  if (!ua) return false;
  const u = ua.toLowerCase();
  for (const needle of SHARE_CRAWLER_UA_SUBSTRINGS) {
    if (u.includes(needle)) return true;
  }
  return false;
}

function currentRd(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.search + window.location.hash;
}

/** Fleet-contract sign-in URL: `/auth/login?rd=<current or override>`. */
export function fleetLoginUrl(rd?: string): string {
  return FLEET_LOGIN + "?rd=" + encodeURIComponent(rd ?? currentRd());
}

/** Fleet-contract sign-out URL: `/auth/logout?rd=<override or "/">`. */
export function fleetLogoutUrl(rd?: string): string {
  return FLEET_LOGOUT + "?rd=" + encodeURIComponent(rd ?? "/");
}

export function fleetSignIn(rd?: string): void {
  if (typeof window !== "undefined") window.location.href = fleetLoginUrl(rd);
}

export function fleetSignOut(rd?: string): void {
  if (typeof window !== "undefined") window.location.href = fleetLogoutUrl(rd);
}

/**
 * Thin wrapper over `useMe()` with fleet defaults — `/api/me`, 401 treated
 * as anonymous. Returns the same shape plus `signIn`/`signOut` bound to
 * the fleet contract URLs.
 */
export interface UseIdentityResult<T extends BaseMe> extends UseMeResult<T> {
  signIn: (rd?: string) => void;
  signOut: (rd?: string) => void;
}
export function useIdentity<T extends BaseMe = BaseMe>(
  opts: UseMeOptions<T> = {},
): UseIdentityResult<T> {
  const base = useMe<T>({ endpoint: FLEET_ME, treat401AsAnonymous: true, ...opts });
  return { ...base, signIn: fleetSignIn, signOut: fleetSignOut };
}

/**
 * Renders `children` only for authenticated users. Anonymous browser
 * navigation triggers a `window.location` redirect to the fleet login.
 * Share-preview crawlers (UA match) and SSR/Next get `children`
 * unconditionally so the static `<meta og:*>` block remains readable.
 */
export interface AuthGateProps {
  children: React.ReactNode;
  /** Override the post-login redirect target. Default = current location. */
  rd?: string;
  /** What to show while `/api/me` is in flight. Default = `null`. */
  loadingFallback?: React.ReactNode;
  /**
   * Pre-resolved User-Agent for SSR/Next environments. When supplied and
   * matching a known crawler, the gate is bypassed and `children` render
   * directly. In CSR `navigator.userAgent` is used.
   */
  userAgent?: string;
  /** When true, skip the redirect (render `null` instead). */
  disableRedirect?: boolean;
}
export function AuthGate({
  children,
  rd,
  loadingFallback = null,
  userAgent,
  disableRedirect,
}: AuthGateProps): JSX.Element | null {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : undefined);
  const crawler = isShareCrawler(ua);
  const { me, loading } = useIdentity();

  useEffect(() => {
    if (crawler) return;
    if (loading) return;
    if (me) return;
    if (disableRedirect) return;
    fleetSignIn(rd);
  }, [crawler, loading, me, rd, disableRedirect]);

  if (crawler) return <>{children}</>;
  if (loading) return <>{loadingFallback}</>;
  if (!me) return null;
  return <>{children}</>;
}

/* ---------- Buttons ---------- */

const baseBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.45rem 0.85rem",
  borderRadius: "var(--etu-radius-md, 0.5rem)",
  border: "1px solid var(--etu-border, rgba(255,255,255,0.12))",
  background: "var(--etu-surface, transparent)",
  color: "var(--etu-fg, inherit)",
  cursor: "pointer",
  fontSize: "0.875rem",
  lineHeight: 1,
};

export interface LoginButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Override the post-login redirect target. */
  rd?: string;
  /** Label override. Default: "Sign in". */
  label?: React.ReactNode;
}
export function LoginButton({
  rd,
  label = "Sign in",
  style,
  ...rest
}: LoginButtonProps): JSX.Element {
  return (
    <button
      type="button"
      data-etu-auth="login"
      style={{ ...baseBtn, ...style }}
      onClick={() => fleetSignIn(rd)}
      {...rest}
    >
      {label}
    </button>
  );
}

export interface LogoutButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  rd?: string;
  label?: React.ReactNode;
}
export function LogoutButton({
  rd,
  label = "Sign out",
  style,
  ...rest
}: LogoutButtonProps): JSX.Element {
  return (
    <button
      type="button"
      data-etu-auth="logout"
      style={{ ...baseBtn, ...style }}
      onClick={() => fleetSignOut(rd)}
      {...rest}
    >
      {label}
    </button>
  );
}

/* ---------- Session badge (sidebar bottom pill) ---------- */

export interface SessionBadgeProps {
  /** Override the identity. By default, `useIdentity()` is used. */
  me?: BaseMe | null;
  /** Click target. Default: do nothing; consumers usually navigate to /more. */
  onClick?: () => void;
  /** Class hook for app-side overrides. */
  className?: string;
}
export function SessionBadge({
  me: overrideMe,
  onClick,
  className,
}: SessionBadgeProps): JSX.Element | null {
  const { me: hookMe } = useIdentity();
  const me = overrideMe ?? hookMe;
  if (!me) return null;
  const label = me.name || me.preferred_username || me.email;
  const initial = (label || "?").trim().charAt(0).toUpperCase();
  return (
    <button
      type="button"
      data-etu-auth="session-badge"
      className={className}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.55rem",
        padding: "0.35rem 0.55rem",
        borderRadius: "var(--etu-radius-md, 0.5rem)",
        border: "1px solid transparent",
        background: "transparent",
        color: "var(--etu-fg, inherit)",
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        textAlign: "left",
        fontSize: "0.85rem",
        lineHeight: 1.2,
      }}
    >
      <span
        aria-hidden
        style={{
          width: "1.6rem",
          height: "1.6rem",
          borderRadius: "999px",
          background: "var(--etu-accent, #0d9488)",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: "0.85rem",
          flex: "0 0 auto",
        }}
      >
        {initial}
      </span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
          flex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ---------- SessionExpiredDialog ---------- */

/**
 * Listens for `etu:session-expired` events and mounts a single
 * dialog directing the user to sign in again. Apps trigger it by
 * dispatching the event from their XHR error handler when /api/* returns
 * 401 after the initial `/api/me` succeeded.
 */
export interface SessionExpiredDialogProps {
  title?: React.ReactNode;
  message?: React.ReactNode;
  signInLabel?: React.ReactNode;
  /** Optional class hook for the dialog root. */
  className?: string;
}
export function SessionExpiredDialog({
  title = "Session expired",
  message = "Your session ended. Sign in again to continue.",
  signInLabel = "Sign in",
  className,
}: SessionExpiredDialogProps): JSX.Element | null {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onExpired = () => setOpen(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);
  const onSignIn = useCallback(() => fleetSignIn(), []);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="etu-session-expired-title"
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          maxWidth: "22rem",
          width: "calc(100% - 2rem)",
          background: "var(--etu-surface, #1f2937)",
          color: "var(--etu-fg, #f9fafb)",
          borderRadius: "var(--etu-radius-lg, 0.75rem)",
          padding: "1.25rem 1.25rem 1rem",
          boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
        }}
      >
        <h2
          id="etu-session-expired-title"
          style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}
        >
          {title}
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", opacity: 0.85 }}>
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            data-etu-auth="session-expired-signin"
            style={{
              ...baseBtn,
              background: "var(--etu-accent, #0d9488)",
              borderColor: "transparent",
              color: "#fff",
            }}
            onClick={onSignIn}
          >
            {signInLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Dispatch the `etu:session-expired` event. Call from your XHR layer. */
export function notifySessionExpired(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/** Dispatch the `etu:me-refresh` event so any mounted `useMe`/`useIdentity` re-fetches. */
export function refreshIdentity(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REFRESH_EVENT));
}
