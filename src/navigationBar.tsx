/**
 * `<NavigationBar>` — iOS-style small-title navigation bar.
 *
 * Default surface for per-page chrome across the fleet (WWDC22 drill-down
 * navigation, iOS 26 Liquid Glass material). Replaces the retired global
 * avatar top bar; profile lives on `/more` + the desktop sidebar footer now.
 *
 * Single 48px row (Android Material 3 hit-area floor; supersedes iOS 44pt),
 * with `padding-top: env(safe-area-inset-top)` when `sticky`.
 *
 * Grid: leading/back | centered title (ellipsis) | trailing.
 *
 * Back semantics:
 *  - function → call it
 *  - string   → `history.pushState(null, "", str)` + `popstate` event
 *  - `true`   → `history.back()`
 *  - falsy    → no back affordance
 *
 * Generic Unicode glyphs only (no SF Symbols). Backdrop-filter paired with
 * a solid fallback for browsers without support.
 */

import type { ReactNode, MouseEvent } from "react";

export interface NavigationBarProps {
  title: string;
  back?: boolean | string | (() => void);
  /** Default: "뒤로". */
  backLabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Default: true. When true, sticks to top + applies safe-area-inset-top. */
  sticky?: boolean;
  /** Default: false. When true, omits the bottom hairline border. */
  borderless?: boolean;
  /**
   * Default: true. Bar starts at 0.8 opacity and strengthens to 1 with a
   * heavier shadow after the page scrolls past 24px. Pure-CSS via the
   * `etu-navbar--scrolled` class toggled on a scroll listener.
   */
  fadeOnScroll?: boolean;
  /** ARIA label for the inner <nav>. Default: title. */
  ariaLabel?: string;
  /** Extra class merged onto `etu-navbar`. */
  className?: string;
}

function ChevronLeft() {
  return (
    <span className="etu-navbar-chevron" aria-hidden>
      {"‹"}
    </span>
  );
}

function resolveBack(back: NavigationBarProps["back"]): (() => void) | null {
  if (!back) return null;
  if (typeof back === "function") return back;
  if (typeof back === "string") {
    return () => {
      if (typeof window === "undefined") return;
      window.history.pushState(null, "", back);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };
  }
  return () => {
    if (typeof window !== "undefined") window.history.back();
  };
}

import { useEffect, useState } from "react";

export function NavigationBar({
  title,
  back,
  backLabel = "뒤로",
  leading,
  trailing,
  sticky = true,
  borderless = false,
  fadeOnScroll = true,
  ariaLabel,
  className,
}: NavigationBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!fadeOnScroll || typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fadeOnScroll]);

  const onBack = resolveBack(back);
  const cls =
    "etu-navbar etu-glass" +
    (sticky ? " etu-navbar--sticky" : "") +
    (borderless ? " etu-navbar--borderless" : "") +
    (fadeOnScroll && scrolled ? " etu-navbar--scrolled" : "") +
    (className ? " " + className : "");

  return (
    <header className={cls} role="banner">
      <nav className="etu-navbar-inner" aria-label={ariaLabel ?? title}>
        <div className="etu-navbar-leading">
          {onBack ? (
            <button
              type="button"
              className="etu-navbar-back"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                onBack();
              }}
              aria-label={backLabel}
            >
              <ChevronLeft />
              <span className="etu-navbar-back-label">{backLabel}</span>
            </button>
          ) : null}
          {leading}
        </div>
        <h1 className="etu-navbar-title" title={title}>
          {title}
        </h1>
        <div className="etu-navbar-trailing">{trailing}</div>
      </nav>
    </header>
  );
}
