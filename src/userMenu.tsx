/**
 * `<UserMenu>` + `<Avatar>` — the fleet-wide profile-picture + dropdown +
 * 로그아웃 surface. Every app's header should have this so users have one
 * place to find "내 정보" and sign out.
 *
 * Desktop: avatar in the header, click to open a dropdown with the display
 * name + email + "내 정보" link + "로그아웃" button. Click outside or press
 * Escape to close.
 *
 * Mobile: same component; the dropdown menu still works, but apps that
 * want a different mobile UI can render `<Avatar>` directly and route to
 * a full-screen settings page on tap.
 *
 * When `me` is `null` (anonymous), the component renders a "로그인" link
 * pointing at `oauth2-proxy` via `signInUrl()` — pass `signedOutAction`
 * to override (e.g. an in-app modal trigger).
 */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { signInUrl, signOut, type BaseMe } from "./useMe";

export interface AvatarProps {
  /** Picture URL — typically `me.picture`. */
  src?: string;
  /** Initial / fallback when no picture is available — typically `me.preferred_username || me.email`. */
  fallback?: string;
  /** px size of the rendered circle. Default: 32. */
  size?: number;
  /** Extra class merged with `etu-avatar`. */
  className?: string;
  /** ARIA label — defaults to "프로필". */
  alt?: string;
}

function pickInitial(fallback?: string): string {
  if (!fallback) return "?";
  const trimmed = fallback.trim();
  if (!trimmed) return "?";
  // For an email, take the local part's first letter.
  const local = trimmed.split("@")[0];
  return local.charAt(0).toUpperCase();
}

/**
 * Round avatar — renders the picture if `src` is given, otherwise an
 * initial letter on a token-colored circle. Use stand-alone or inside
 * `<UserMenu>`.
 */
export function Avatar({ src, fallback, size = 32, className, alt = "프로필" }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showPicture = src && !errored;
  const style = { width: size, height: size };
  return (
    <span
      className={"etu-avatar" + (className ? " " + className : "")}
      style={style}
      aria-label={alt}
      role="img"
    >
      {showPicture ? (
        <img src={src} alt="" onError={() => setErrored(true)} />
      ) : (
        <span className="etu-avatar-initial">{pickInitial(fallback)}</span>
      )}
    </span>
  );
}

export interface UserMenuProps<T extends BaseMe = BaseMe> {
  /** Current identity. `null` shows the signed-out affordance. */
  me: T | null | undefined;
  /** Avatar size. Default: 32. */
  avatarSize?: number;
  /**
   * URL of the "내 정보" page. Default: `/me`. Pass `null` to hide the row.
   */
  myInfoHref?: string | null;
  /** Override the "내 정보" label. */
  myInfoLabel?: string;
  /**
   * Logout handler. Default: `signOut()` (navigates to
   * `/oauth2/sign_out?rd=/`). Pass a custom handler for apps that have
   * their own logout POST (e.g. minccino's `/api/auth/logout`).
   */
  onSignOut?: () => void;
  /** Override the "로그아웃" label. */
  signOutLabel?: string;
  /**
   * Rendered in place of the avatar when `me` is `null`. Default: a
   * "로그인" link pointing at `signInUrl()`.
   */
  signedOutAction?: ReactNode;
  /**
   * Extra rows above 내 정보 / 로그아웃. Use for app-specific quick links
   * (e.g. "내 사이트", "결제"). Pass an array of `{ label, href? | onClick? }`.
   */
  extraItems?: UserMenuItem[];
  /** Extra class merged with `etu-user-menu`. */
  className?: string;
  /**
   * Render an admin badge inside the dropdown when `me.is_admin` is true.
   * Default: true.
   */
  showAdminBadge?: boolean;
  /**
   * Where the dropdown opens relative to the trigger. Default: `"bottom-right"`.
   * Use `"top-right"` when the trigger sits at the bottom of a sidebar foot
   * (pages / festplan layouts) so the menu opens *upward* instead of
   * disappearing past the viewport.
   *
   * The horizontal half controls the dropdown's right/left alignment;
   * the vertical half controls open-up vs open-down.
   */
  placement?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export interface UserMenuItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Open `href` in a new tab. Default: false. */
  external?: boolean;
}

export function UserMenu<T extends BaseMe = BaseMe>({
  me,
  avatarSize = 32,
  myInfoHref = "/me",
  myInfoLabel = "내 정보",
  onSignOut,
  signOutLabel = "로그아웃",
  signedOutAction,
  extraItems,
  className,
  showAdminBadge = true,
  placement = "bottom-right",
}: UserMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me) {
    return (
      <div className={"etu-user-menu" + (className ? " " + className : "")}>
        {signedOutAction ?? (
          <a className="etu-user-menu-sign-in" href={signInUrl()}>
            로그인
          </a>
        )}
      </div>
    );
  }

  const displayName = me.name ?? me.preferred_username ?? me.email;
  const handleSignOut = onSignOut ?? (() => signOut("/"));

  return (
    <div
      ref={rootRef}
      className={"etu-user-menu" + (className ? " " + className : "")}
    >
      <button
        type="button"
        className="etu-user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        title={displayName}
      >
        <Avatar
          src={me.picture}
          fallback={me.preferred_username || me.email}
          size={avatarSize}
        />
      </button>
      {open && (
        <div
          id={menuId}
          className={`etu-user-menu-dropdown etu-user-menu-dropdown--${placement}`}
          role="menu"
          aria-label={displayName}
        >
          <div className="etu-user-menu-header">
            <Avatar
              src={me.picture}
              fallback={me.preferred_username || me.email}
              size={40}
            />
            <div className="etu-user-menu-header-text">
              <div className="etu-user-menu-name">
                {displayName}
                {showAdminBadge && me.is_admin && (
                  <span className="etu-user-menu-admin">admin</span>
                )}
              </div>
              {displayName !== me.email && (
                <div className="etu-user-menu-email">{me.email}</div>
              )}
            </div>
          </div>
          <div className="etu-user-menu-divider" />
          <div className="etu-user-menu-items">
            {extraItems?.map((it, i) => (
              <MenuItem key={i} item={it} close={() => setOpen(false)} />
            ))}
            {myInfoHref && (
              <MenuItem
                item={{ label: myInfoLabel, href: myInfoHref }}
                close={() => setOpen(false)}
              />
            )}
            <button
              type="button"
              role="menuitem"
              className="etu-user-menu-item etu-user-menu-item--danger"
              onClick={() => {
                setOpen(false);
                handleSignOut();
              }}
            >
              {signOutLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ item, close }: { item: UserMenuItem; close: () => void }) {
  const { label, href, onClick, external } = item;
  if (href) {
    return (
      <a
        role="menuitem"
        className="etu-user-menu-item"
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        onClick={close}
      >
        {label}
      </a>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      className="etu-user-menu-item"
      onClick={() => {
        close();
        onClick?.();
      }}
    >
      {label}
    </button>
  );
}
