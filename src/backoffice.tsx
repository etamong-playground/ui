/**
 * Backoffice scaffold — the admin-gate + 관리자 전용 badge + page-head layout
 * that 5+ etamong-lab apps reimplement (pages "권한" tab, festplan /console,
 * draw /admin, minccino backoffice, service-admin, shortener moderation,
 * the LLM prompt-audit consoles per the house-pattern).
 *
 * The gate is a logical OR across `is_admin`, an email allowlist, a role
 * set, and an arbitrary predicate — apps add whatever signal they have.
 *
 * Composes with `useMe` (v0.10) — pass `me` straight through.
 */

import type { ReactNode } from "react";
import type { BaseMe } from "./useMe";

export interface AdminCheckInput<T extends BaseMe = BaseMe> {
  /** The current identity (from `useMe`). `null` = anonymous. */
  me: T | null | undefined;
  /** App-managed allowlist (case-insensitive on the local part / domain). */
  emails?: string[];
  /** Pass if `me.roles` intersects this set. */
  roles?: string[];
  /** Last-resort custom check (e.g. flags like `can_create_apps`). */
  predicate?: (me: T) => boolean;
}

/**
 * Returns `true` when *any* of the configured signals says the user is
 * allowed in. With nothing configured, only `me.is_admin` counts.
 */
export function isAdminLike<T extends BaseMe>(input: AdminCheckInput<T>): boolean {
  const { me, emails, roles, predicate } = input;
  if (!me) return false;
  if (me.is_admin) return true;
  if (emails && me.email && emails.some((e) => e.toLowerCase() === me.email.toLowerCase())) {
    return true;
  }
  if (roles && me.roles && me.roles.some((r) => roles.includes(r))) {
    return true;
  }
  if (predicate && predicate(me)) return true;
  return false;
}

export interface AdminGateProps<T extends BaseMe = BaseMe> extends AdminCheckInput<T> {
  /** Rendered when the user is allowed in. */
  children: ReactNode;
  /**
   * Rendered when the user is NOT allowed in. Default: `null` (nothing).
   * Pass a friendly "권한이 없어요" surface or a redirect-trigger here.
   */
  fallback?: ReactNode;
}

export function AdminGate<T extends BaseMe = BaseMe>(props: AdminGateProps<T>) {
  const { children, fallback = null, ...check } = props;
  return <>{isAdminLike(check) ? children : fallback}</>;
}

export interface AdminBadgeProps {
  /** Default: "관리자 전용". */
  label?: string;
  /** Extra class merged with `etu-admin-badge`. */
  className?: string;
}

/**
 * Small inline badge that marks a page / section as admin-only. Pair with
 * `AdminGate` so users without access never see it in the first place,
 * but admins always know the surface they're on.
 */
export function AdminBadge({ label = "관리자 전용", className }: AdminBadgeProps) {
  return (
    <span
      className={"etu-admin-badge" + (className ? " " + className : "")}
      title={label}
    >
      <DefaultLockIcon />
      {label}
    </span>
  );
}

export interface BackofficeLayoutProps {
  /** Page title. */
  title: ReactNode;
  /** Optional subtitle line below the title. */
  description?: ReactNode;
  /** Right-side actions (buttons, search, filter). */
  actions?: ReactNode;
  /** Override the "관리자 전용" badge — pass `null` to hide it entirely. */
  badge?: ReactNode | null;
  /** Page body. */
  children: ReactNode;
  /** Extra class merged with `etu-backoffice`. */
  className?: string;
}

/**
 * Standard page-head layout for a backoffice route: title + AdminBadge +
 * optional actions, then the page body.
 */
export function BackofficeLayout({
  title,
  description,
  actions,
  badge,
  children,
  className,
}: BackofficeLayoutProps) {
  return (
    <div className={"etu-backoffice" + (className ? " " + className : "")}>
      <header className="etu-backoffice-head">
        <div className="etu-backoffice-head-text">
          <h1 className="etu-backoffice-title">
            {title}
            {badge === undefined ? <AdminBadge /> : badge}
          </h1>
          {description && <p className="etu-backoffice-description">{description}</p>}
        </div>
        {actions && <div className="etu-backoffice-actions">{actions}</div>}
      </header>
      <div className="etu-backoffice-body">{children}</div>
    </div>
  );
}

function DefaultLockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
