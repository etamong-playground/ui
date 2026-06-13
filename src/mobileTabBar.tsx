/**
 * `<MobileTabBar>` — fixed bottom tab bar for narrow viewports.
 *
 * Render alongside a desktop sidebar; the bar hides itself at the desktop
 * breakpoint via the `etu-mobile-tab-bar` class (`display: none` on
 * `min-width: 720px`). On mobile, it sits at the bottom with safe-area-inset
 * padding so it clears the iOS home indicator.
 *
 * Router-agnostic: each item is `{ id, label, icon, active, onClick? | href? }`.
 * Pass `onClick` for SPA navigation (call your router); pass `href` to render
 * an `<a>` (works with Next.js `<Link>` via the `as` prop too, but a plain
 * anchor is enough for full-page navigation).
 *
 * Active state is supplied externally — the bar does not read the URL.
 *
 * Reference: schedule-manager's `bottom-nav.tsx`.
 */

import type { ReactNode, MouseEvent } from "react";

export interface MobileTabBarItem {
  /** Stable key used for React reconciliation. */
  id: string;
  /** Short label shown under the icon. Keep ~5 chars to fit 5 tabs on a 360px viewport. */
  label: ReactNode;
  /** Icon node — typically a lucide-react `<Home size={24} />` or an inline SVG. */
  icon: ReactNode;
  /** Whether this tab is the current one. The caller computes this from its route. */
  active?: boolean;
  /** Click handler. Use this for SPA-style in-app navigation. */
  onClick?: () => void;
  /** Link target. Renders an `<a>` instead of a `<button>`. */
  href?: string;
}

export interface MobileTabBarProps {
  items: MobileTabBarItem[];
  /** ARIA label for the nav landmark. Default: "주요 메뉴". */
  ariaLabel?: string;
  /** Extra class merged with `etu-mobile-tab-bar`. */
  className?: string;
}

export function MobileTabBar({ items, ariaLabel = "주요 메뉴", className }: MobileTabBarProps) {
  return (
    <nav
      className={"etu-mobile-tab-bar etu-glass" + (className ? " " + className : "")}
      aria-label={ariaLabel}
    >
      {items.map((it) => {
        const cls =
          "etu-mobile-tab-bar-item" + (it.active ? " etu-mobile-tab-bar-item--active" : "");
        const inner = (
          <>
            <span className="etu-mobile-tab-bar-icon" aria-hidden>
              {it.icon}
            </span>
            <span className="etu-mobile-tab-bar-label">{it.label}</span>
          </>
        );
        if (it.href) {
          return (
            <a
              key={it.id}
              className={cls}
              href={it.href}
              aria-current={it.active ? "page" : undefined}
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                if (it.onClick) {
                  e.preventDefault();
                  it.onClick();
                }
              }}
            >
              {inner}
            </a>
          );
        }
        return (
          <button
            key={it.id}
            type="button"
            className={cls}
            aria-current={it.active ? "page" : undefined}
            onClick={it.onClick}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
