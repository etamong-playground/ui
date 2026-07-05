/**
 * `<Sidebar>` — tablet+desktop sidebar shell. The wide-viewport counterpart
 * to `<MobileTabBar>`; together they implement the fleet nav-shape contract
 * documented in `planning/wiki/concepts/sidebar-composition.md` and the
 * 3-tier breakpoint contract in `responsive-3tier.md`.
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
 * renderers. The bar hides itself at the mobile breakpoint
 * (`max-width: 719px`) and `<MobileTabBar>` hides itself above it, so
 * mounting both unconditionally is correct.
 *
 * Tablet behavior (720–1023px) is controlled by `tabletMode`:
 *   - "rail"   — inline-collapsible sidebar. Default. Collapsed = icon-only
 *                ~64px column (items carry tooltips); expanded = the normal
 *                240px sidebar, pushing content — no overlay, no scrim. A
 *                chevrons toggle under the header flips it at BOTH the
 *                tablet and desktop tiers; the default follows the tier
 *                (tablet collapsed / desktop expanded) and re-derives when
 *                the viewport crosses 1024px. iPad Mini portrait (768px)
 *                needs the collapsed default — a full 240px sidebar leaves
 *                only 528px for content and many grid layouts collapse to
 *                an empty column.
 *   - "drawer" — hidden by default; consumer mounts `<SidebarToggle>` in
 *                their app bar. The drawer slides in over a scrim and
 *                auto-dismisses on route change (parent flips `open`).
 *   - "full"   — keeps the old v0.27 behavior (240px at ≥720px). Use only
 *                when the app is desktop-first and tablet sizes are rare.
 *
 * Router-agnostic: each item is `{ id, label, icon, active, onClick?
 * | href? }` (same shape as `MobileTabBarItem`). Active state is supplied
 * externally — the sidebar does not read the URL.
 *
 * No `userMenu` prop. Identity + Logout live in `footer` (mirrors the
 * mobile `/more` AppInfoSection + `[Logout]` button). Header-dropdown
 * UserMenus are the retired anti-pattern.
 */

import { useCallback, useEffect, useState, type ReactNode, type MouseEvent } from "react";
import { isInputTarget, shortcutKey } from "./keywords";
import { useViewport } from "./viewport";

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
  /**
   * Behavior at the tablet tier (720–1023px). Default: `"rail"`.
   *   - "rail"   inline-collapsible: icon-only ~64px column ↔ full 240px,
   *              user-toggled at both the tablet and desktop tiers; the
   *              default follows the tier (tablet collapsed / desktop
   *              expanded)
   *   - "drawer" hidden until `open` is true; mount `<SidebarToggle>` in
   *              your app bar to flip it
   *   - "full"   v0.27 behavior — full 240px sidebar at all ≥720px widths
   * "drawer"/"full" have no effect at the mobile (<720) or desktop (≥1024)
   * tier.
   */
  tabletMode?: "rail" | "drawer" | "full";
  /**
   * Drawer open state (drawer mode only). Controlled — pair with
   * `onOpenChange`. Auto-flips to `false` when the route changes (the
   * parent component is expected to call `onOpenChange(false)` after
   * navigation; or use the built-in `<SidebarToggle>` helper which wires
   * this up). Ignored unless `tabletMode === "drawer"`.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * ARIA label for the rail-mode toggle while collapsed (clicking expands).
   * Default: "메뉴 펼치기".
   */
  railExpandLabel?: string;
  /**
   * ARIA label for the rail-mode toggle while expanded (clicking collapses).
   * Default: "메뉴 접기".
   */
  railCollapseLabel?: string;
}

function Item({
  item,
  collapsed,
}: {
  item: SidebarItem;
  collapsed?: boolean;
}) {
  const cls =
    "etu-sidebar-item" + (item.active ? " etu-sidebar-item--active" : "");
  const strLabel = typeof item.label === "string" ? item.label : undefined;
  const showTitle = collapsed === true && strLabel != null;
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
        aria-label={strLabel}
        title={showTitle ? strLabel : undefined}
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
      aria-label={strLabel}
      title={showTitle ? strLabel : undefined}
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
  tabletMode = "rail",
  open,
  onOpenChange,
  railExpandLabel = "메뉴 펼치기",
  railCollapseLabel = "메뉴 접기",
}: SidebarProps) {
  const viewport = useViewport();
  // Inline collapse state for rail mode. `null` until the tier default is
  // derived (pre-hydration CSS covers that window); re-derives whenever the
  // tier changes so a resize across 1024px lands on the tier's default.
  const [expanded, setExpanded] = useState<boolean | null>(null);
  useEffect(() => {
    if (tabletMode !== "rail") return;
    if (viewport === "desktop") setExpanded(true);
    else if (viewport === "tablet") setExpanded(false);
  }, [tabletMode, viewport]);
  const collapsed = !(expanded ?? viewport === "desktop");

  const dataAttrs: Record<string, string> = {
    "data-tablet-mode": tabletMode,
  };
  if (tabletMode === "drawer") {
    dataAttrs["data-open"] = open ? "true" : "false";
  }
  if (tabletMode === "rail" && expanded !== null) {
    dataAttrs["data-expanded"] = expanded ? "true" : "false";
  }

  useEffect(() => {
    if (tabletMode !== "drawer" || !open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange?.(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tabletMode, open, onOpenChange]);

  // ⌘/Ctrl+B toggles the rail (VS Code / shadcn convention). IME-safe via
  // shortcutKey; skipped in text-entry targets where ⌘B commonly means bold.
  useEffect(() => {
    if (tabletMode !== "rail" || viewport === "mobile") return;
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.repeat) return;
      if (shortcutKey(e) !== "b" || isInputTarget(e)) return;
      e.preventDefault();
      setExpanded(collapsed);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tabletMode, viewport, collapsed]);

  const hasSections = secondarySections && secondarySections.length > 0;
  const hasFlatSecondary = secondary && secondary.length > 0;

  if (hasSections && hasFlatSecondary) {
    const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
      .process;
    if (!proc || !proc.env || proc.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[@etamong-playground/ui] <Sidebar>: both `secondary` and `secondarySections` " +
          "were passed; `secondarySections` wins. Drop one to silence this warning.",
      );
    }
  }

  const itemProps = {
    collapsed: tabletMode === "rail" ? collapsed : false,
  };

  return (
    <>
      {tabletMode === "drawer" && open ? (
        <div
          className="etu-sidebar-scrim"
          aria-hidden
          onClick={() => onOpenChange?.(false)}
        />
      ) : null}
    <aside
      className={"etu-sidebar" + (className ? " " + className : "")}
      aria-label={ariaLabel}
      {...dataAttrs}
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
      {tabletMode === "rail" ? (
        <button
          type="button"
          className="etu-sidebar-rail-toggle"
          aria-label={collapsed ? railExpandLabel : railCollapseLabel}
          aria-expanded={!collapsed}
          title={`${collapsed ? railExpandLabel : railCollapseLabel} (${
            typeof navigator !== "undefined" && /Mac|iP/.test(navigator.platform)
              ? "⌘B"
              : "Ctrl+B"
          })`}
          onClick={() => setExpanded(collapsed)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {collapsed ? (
              <>
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </>
            ) : (
              <>
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </>
            )}
          </svg>
        </button>
      ) : null}
      <nav className="etu-sidebar-section etu-sidebar-section--primary">
        {primary.map((it) => (
          <Item key={it.id} item={it} {...itemProps} />
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
                <Item key={it.id} item={it} {...itemProps} />
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
              <Item key={it.id} item={it} {...itemProps} />
            ))}
          </nav>
        ) : null}
      {footer ? <div className="etu-sidebar-footer">{footer}</div> : null}
    </aside>
    </>
  );
}

export interface SidebarToggleProps {
  /** Whether the drawer is currently open. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ARIA label. Default: "메뉴 열기" / "메뉴 닫기" via `labelOpen`/`labelClose`. */
  labelOpen?: string;
  labelClose?: string;
  /** Extra class merged with `etu-sidebar-toggle`. */
  className?: string;
}

/**
 * Hamburger button that flips the `<Sidebar tabletMode="drawer">` open
 * state. Visible only at the tablet tier (≥720 and <1024). Mobile users
 * use `<MobileTabBar>`; desktop users see the full sidebar already.
 */
export function SidebarToggle({
  open,
  onOpenChange,
  labelOpen = "메뉴 열기",
  labelClose = "메뉴 닫기",
  className,
}: SidebarToggleProps) {
  const onClick = useCallback(
    () => onOpenChange(!open),
    [open, onOpenChange],
  );
  return (
    <button
      type="button"
      className={"etu-sidebar-toggle" + (className ? " " + className : "")}
      aria-label={open ? labelClose : labelOpen}
      aria-expanded={open}
      onClick={onClick}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        {open ? (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        ) : (
          <>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </>
        )}
      </svg>
    </button>
  );
}

/**
 * State hook for the drawer mode. Persists open/closed in sessionStorage
 * (not localStorage — drawer state is per-session, not a preference) and
 * auto-closes when `routeKey` changes (pass your current path/hash).
 */
export function useSidebarDrawer(
  appKey: string,
  routeKey?: string,
): [boolean, (open: boolean) => void] {
  const storage = `${appKey}-sidebar-drawer-open`;
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(storage) === "1";
    } catch {
      return false;
    }
  });
  const set = useCallback(
    (next: boolean) => {
      setOpen(next);
      try {
        if (next) sessionStorage.setItem(storage, "1");
        else sessionStorage.removeItem(storage);
      } catch {
        /* ignore */
      }
    },
    [storage],
  );
  // Auto-close on navigation.
  useEffect(() => {
    if (routeKey === undefined) return;
    set(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);
  return [open, set];
}
