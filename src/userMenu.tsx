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
 *
 * `variant="full"` (v0.43) renders a full-width avatar + name + email row
 * instead of the avatar circle — the canonical `<Sidebar footer>` identity
 * control. Pair with `placement="top-right"` so the popover opens upward
 * from the bottom of the sidebar. `themeToggle` adds a light/dark row to
 * the popover (backed by `getTheme`/`setTheme`) and `badges` adds
 * role/permission pills under the name — both additive, both optional.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { signInUrl, signOut, type BaseMe } from "./useMe";
import { getTheme, setTheme, type Theme } from "./theme";

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
   * Preferred placement of the dropdown relative to the trigger.
   * Default: `"bottom-right"`. Use `"top-right"` when the trigger sits at the
   * bottom of a sidebar foot (pages / festplan layouts) so the menu opens
   * *upward* instead of pointing at the viewport edge.
   *
   * The horizontal half controls the dropdown's right/left alignment; the
   * vertical half controls open-up vs open-down. The component auto-flips
   * either axis on open when the requested side doesn't fit — so a layout
   * that becomes a horizontal topbar on mobile won't strand the menu above
   * the viewport.
   */
  placement?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /**
   * Full-width identity trigger — avatar + name + email stacked — instead
   * of the avatar-only circle. This is the canonical `<Sidebar footer>`
   * control (v0.43): drop
   * `<UserMenu variant="full" placement="top-right" .../>` straight into
   * `footer` and it opens the same popover as the header trigger, upward.
   * Default `"avatar"` — the existing header trigger, unchanged.
   */
  variant?: "avatar" | "full";
  /**
   * Extra role/permission badges rendered under the name, each a
   * `.etu-badge` pill. Independent of `showAdminBadge` (the inline "admin"
   * pill next to the name) — use this for app-specific roles ("owner",
   * "billing", …) or permission flags. (v0.43)
   */
  badges?: UserMenuBadge[];
  /**
   * Renders a light/dark row inside the popover, backed by `getTheme`/
   * `setTheme`. Omit to leave theme switching to the app — the row does
   * not appear by default. The fleet convention (v0.43): the theme toggle
   * lives here, not as a loose icon in the sidebar footer. (v0.43)
   */
  themeToggle?: UserMenuThemeToggle;
}

export interface UserMenuBadge {
  label: ReactNode;
  /** Tint — matches the `.etu-badge--*` modifiers. Default: `"neutral"`. */
  tone?: "accent" | "ok" | "warn" | "err" | "neutral";
}

export interface UserMenuThemeToggle {
  /** Same `appKey` passed to `getTheme`/`setTheme`/`noFlashThemeScript`. */
  appKey: string;
  /** Row label when currently light (offers switching to dark). Default: "다크 모드". */
  darkLabel?: string;
  /** Row label when currently dark (offers switching to light). Default: "라이트 모드". */
  lightLabel?: string;
}

export interface UserMenuItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Open `href` in a new tab. Default: false. */
  external?: boolean;
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
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
  variant = "avatar",
  badges,
  themeToggle,
}: UserMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme | null>(null);
  const [computedPlacement, setComputedPlacement] = useState(placement);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  // Auto-flip the requested placement when it would push the dropdown off the
  // viewport. Match the CSS contract in styles.css:
  //   - "right" horizontal: dropdown's right edge aligns with the trigger's
  //     right edge → it extends LEFTWARD; needs trigger.right px of space.
  //   - "left"  horizontal: dropdown's left  edge aligns with the trigger's
  //     left  edge → it extends RIGHTWARD; needs (viewport - trigger.left) px.
  //   - "top"    vertical: opens upward;   needs trigger.top px above.
  //   - "bottom" vertical: opens downward; needs (viewport - trigger.bottom) px.
  // Menu size is estimated from the CSS (min-width 14rem, typical height
  // ~220px) — good enough for "is there room?".
  useEffect(() => {
    if (!open) {
      setComputedPlacement(placement);
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = 240;
    const menuH = 220;
    const [vReq, hReq] = placement.split("-") as ["top" | "bottom", "left" | "right"];
    let v: "top" | "bottom" = vReq;
    let h: "left" | "right" = hReq;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    if (v === "top" && spaceAbove < menuH && spaceBelow > spaceAbove) v = "bottom";
    else if (v === "bottom" && spaceBelow < menuH && spaceAbove > spaceBelow) v = "top";

    const spaceForRight = rect.right;
    const spaceForLeft = vw - rect.left;
    if (h === "right" && spaceForRight < menuW && spaceForLeft > spaceForRight) h = "left";
    else if (h === "left" && spaceForLeft < menuW && spaceForRight > spaceForLeft) h = "right";

    setComputedPlacement(`${v}-${h}` as typeof placement);
  }, [open, placement]);

  // Re-read the theme on every open — it may have changed elsewhere (another
  // toggle, another tab) while the popover was closed.
  useEffect(() => {
    if (open && themeToggle) setThemeState(getTheme(themeToggle.appKey));
  }, [open, themeToggle]);

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
      className={
        "etu-user-menu" +
        (variant === "full" ? " etu-user-menu--full" : "") +
        (className ? " " + className : "")
      }
    >
      <button
        ref={triggerRef}
        type="button"
        className={
          "etu-user-menu-trigger" +
          (variant === "full" ? " etu-user-menu-trigger--full" : "")
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        title={variant === "full" ? undefined : displayName}
      >
        <Avatar
          src={me.picture}
          fallback={me.preferred_username || me.email}
          size={avatarSize}
        />
        {variant === "full" && (
          <span className="etu-user-menu-trigger-text">
            <span className="etu-user-menu-trigger-name">{displayName}</span>
            {displayName !== me.email && (
              <span className="etu-user-menu-trigger-email">{me.email}</span>
            )}
          </span>
        )}
      </button>
      {open && (
        <div
          id={menuId}
          className={`etu-user-menu-dropdown etu-user-menu-dropdown--${computedPlacement}`}
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
              {badges && badges.length > 0 && (
                <div className="etu-user-menu-badges">
                  {badges.map((b, i) => (
                    <span
                      key={i}
                      className={
                        "etu-badge" +
                        (b.tone && b.tone !== "neutral" ? ` etu-badge--${b.tone}` : "")
                      }
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
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
            {themeToggle && theme && (
              <button
                type="button"
                role="menuitem"
                className="etu-user-menu-item"
                onClick={() => {
                  const next: Theme = theme === "dark" ? "light" : "dark";
                  setTheme(themeToggle.appKey, next);
                  setThemeState(next);
                }}
              >
                <span className="etu-user-menu-item-icon" aria-hidden>
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                </span>
                {theme === "dark"
                  ? (themeToggle.lightLabel ?? "라이트 모드")
                  : (themeToggle.darkLabel ?? "다크 모드")}
              </button>
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
