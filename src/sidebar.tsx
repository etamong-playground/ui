/**
 * `<Sidebar>` — desktop sidebar shell. The wide-viewport counterpart to
 * `<MobileTabBar>`; together they implement the fleet nav-shape contract
 * documented in `planning/wiki/concepts/sidebar-composition.md`.
 *
 * Composition (top → bottom):
 *
 *   ┌──────────────────┐
 *   │ AppHeader        │  appName + appIcon (optional)
 *   ├──────────────────┤
 *   │ PrimaryNavList   │  same items as the mobile tab bar
 *   ├──────────────────┤
 *   │ SecondaryNavList │  same items as the /more page (Settings, Admin, …)
 *   ├──────────────────┤
 *   │ SidebarFooter    │  caller-supplied node (identity + Logout + DeployInfo)
 *   └──────────────────┘
 *
 * Drive `primary` and `secondary` from the same arrays you feed
 * `<MobileTabBar items={primary.slice(0, 4).concat([moreTab])} />` and the
 * `/more` page renderer respectively — one source of truth, two
 * renderers. The desktop bar hides itself at the mobile breakpoint
 * (`max-width: 719px`) and `<MobileTabBar>` hides itself above it, so
 * mounting both unconditionally is correct.
 *
 * Router-agnostic: each item is `{ id, label, icon, active, onClick?
 * | href? }` (same shape as `MobileTabBarItem`). Active state is supplied
 * externally — the sidebar does not read the URL.
 *
 * No `userMenu` prop. Identity + Logout live in `footer` (mirrors the
 * mobile `/more` AppInfoSection + `[Logout]` button). Header-dropdown
 * UserMenus are the retired anti-pattern.
 */

import type { ReactNode, MouseEvent } from "react";

export interface SidebarItem {
  /** Stable key used for React reconciliation. */
  id: string;
  /** Display label. */
  label: ReactNode;
  /** Icon node — typically a lucide-react icon. */
  icon?: ReactNode;
  /** Whether this item is the current route. Caller computes from its router. */
  active?: boolean;
  /** Click handler for SPA-style navigation. */
  onClick?: () => void;
  /** Link target. Renders an `<a>` instead of a `<button>`. */
  href?: string;
}

export interface SidebarProps {
  /** App display name shown in the header (e.g. "schedule-manager", "🎪 Festplan"). */
  appName?: ReactNode;
  /** Optional logo / icon node to the left of the name. */
  appIcon?: ReactNode;
  /** Optional element rendered under the app name (org switcher, plan badge, …). */
  appHeaderExtra?: ReactNode;
  /**
   * Primary destinations — mirror the same array that feeds
   * `<MobileTabBar items={primary.slice(0, 4).concat([moreTab])} />`.
   */
  primary: SidebarItem[];
  /**
   * Secondary destinations — mirror the array that feeds the `/more`
   * page (Settings, Admin, …). Pass an empty array if the app has no
   * secondary nav.
   */
  secondary?: SidebarItem[];
  /** Caption above the secondary list. Default: "더보기". Pass `null` to omit. */
  secondaryCaption?: ReactNode | null;
  /**
   * Footer node — identity + Logout + build info. The convention is to
   * render an inline `<AppInfoSection>`-style identity row plus a
   * `[Logout]` button; `<DeployInfo>` may go inline at the very bottom.
   * Pass `null` for an anonymous shell (login routes, public-only hosts).
   */
  footer?: ReactNode;
  /** ARIA label for the nav landmark. Default: "주 메뉴". */
  ariaLabel?: string;
  /** Extra class merged with `etu-sidebar`. */
  className?: string;
}

function Item({ item }: { item: SidebarItem }) {
  const cls =
    "etu-sidebar-item" + (item.active ? " etu-sidebar-item--active" : "");
  const inner = (
    <>
      {item.icon ? (
        <span className="etu-sidebar-item-icon" aria-hidden>
          {item.icon}
        </span>
      ) : null}
      <span className="etu-sidebar-item-label">{item.label}</span>
    </>
  );
  if (item.href) {
    return (
      <a
        className={cls}
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          if (item.onClick) {
            e.preventDefault();
            item.onClick();
          }
        }}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      aria-current={item.active ? "page" : undefined}
      onClick={item.onClick}
    >
      {inner}
    </button>
  );
}

export function Sidebar({
  appName,
  appIcon,
  appHeaderExtra,
  primary,
  secondary,
  secondaryCaption = "더보기",
  footer,
  ariaLabel = "주 메뉴",
  className,
}: SidebarProps) {
  const showSecondary = secondary && secondary.length > 0;
  return (
    <aside
      className={"etu-sidebar" + (className ? " " + className : "")}
      aria-label={ariaLabel}
    >
      {(appName || appIcon || appHeaderExtra) && (
        <div className="etu-sidebar-header">
          {(appIcon || appName) && (
            <div className="etu-sidebar-header-app">
              {appIcon ? (
                <span className="etu-sidebar-header-icon" aria-hidden>
                  {appIcon}
                </span>
              ) : null}
              {appName ? (
                <span className="etu-sidebar-header-name">{appName}</span>
              ) : null}
            </div>
          )}
          {appHeaderExtra ? (
            <div className="etu-sidebar-header-extra">{appHeaderExtra}</div>
          ) : null}
        </div>
      )}
      <nav className="etu-sidebar-section etu-sidebar-section--primary">
        {primary.map((it) => (
          <Item key={it.id} item={it} />
        ))}
      </nav>
      {showSecondary ? (
        <nav
          className="etu-sidebar-section etu-sidebar-section--secondary"
          aria-label={
            typeof secondaryCaption === "string" ? secondaryCaption : undefined
          }
        >
          {secondaryCaption ? (
            <div className="etu-sidebar-caption">{secondaryCaption}</div>
          ) : null}
          {secondary!.map((it) => (
            <Item key={it.id} item={it} />
          ))}
        </nav>
      ) : null}
      {footer ? <div className="etu-sidebar-footer">{footer}</div> : null}
    </aside>
  );
}
