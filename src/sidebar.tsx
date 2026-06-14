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

/**
 * Captioned secondary subsection — used by large apps whose `/more` content
 * grows past ~6 rows and benefits from concern-based grouping
 * (`OPERATE / INVENTORY / GOVERNANCE`, …). Each group renders as its own
 * `<nav>` with an optional caption header above the items. Within a section
 * items are still frequency-ordered.
 */
export interface SidebarSecondarySection {
  /** Stable key used for React reconciliation. Falls back to array index. */
  id?: string;
  /** Caption text shown above the section's items. Omit for a header-less group. */
  caption?: ReactNode;
  /** Items in this section — same row markup as the flat secondary list. */
  items: SidebarItem[];
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
   * Secondary destinations as a flat list — mirror the array that feeds the
   * `/more` page (Settings, Admin, …). Suitable for small apps. Pass an empty
   * array if the app has no secondary nav. When `secondarySections` is also
   * supplied, `secondarySections` wins and this prop is ignored (a dev-only
   * `console.warn` is emitted so consumers notice the override).
   */
  secondary?: SidebarItem[];
  /**
   * Secondary destinations grouped into captioned subsections — for large apps
   * whose `/more` grows past ~6 rows. Each group is concern-based
   * (`OPERATE / INVENTORY / GOVERNANCE`, …) and renders as a separate `<nav>`
   * with an optional caption header. Within a section items are still
   * frequency-ordered. Overrides `secondary` when both are supplied.
   * The same array shape drives the mobile `/more` drill-down rows; see
   * `planning/wiki/concepts/sidebar-composition.md` for the contract.
   */
  secondarySections?: SidebarSecondarySection[];
  /**
   * Caption above the flat secondary list. Default: "더보기". Pass `null` to
   * omit. Applies only when `secondary` is rendered — `secondarySections`
   * carry their own captions per group.
   */
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
  secondarySections,
  secondaryCaption = "더보기",
  footer,
  ariaLabel = "주 메뉴",
  className,
}: SidebarProps) {
  const hasSections = secondarySections && secondarySections.length > 0;
  const hasFlatSecondary = secondary && secondary.length > 0;

  if (hasSections && hasFlatSecondary) {
    const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
      .process;
    if (!proc || !proc.env || proc.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[@etamong-lab/ui] <Sidebar>: both `secondary` and `secondarySections` " +
          "were passed; `secondarySections` wins. Drop one to silence this warning.",
      );
    }
  }

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
      {hasSections
        ? secondarySections!.map((section, idx) => (
            <nav
              key={section.id ?? idx}
              className="etu-sidebar-section etu-sidebar-section--secondary"
              aria-label={
                typeof section.caption === "string" ? section.caption : undefined
              }
            >
              {section.caption ? (
                <div className="etu-sidebar-section-caption">
                  {section.caption}
                </div>
              ) : null}
              {section.items.map((it) => (
                <Item key={it.id} item={it} />
              ))}
            </nav>
          ))
        : hasFlatSecondary ? (
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
