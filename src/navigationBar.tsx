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
  /**
   * Default: true. When false, the sticky bar omits `padding-top:
   * env(safe-area-inset-top)` — for apps that already have a global top
   * chrome bar (brand/avatar/bell row) above the per-page nav. Avoids
   * double safe-area stacking that pushed iOS-PWA page titles below the
   * visible viewport on notched devices.
   */
  safeAreaTop?: boolean;
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

import { useEffect, useRef, useState } from "react";

/**
 * Dev-only proactive layout assertions for the NavigationBar.
 *
 * Goal: catch layout regressions on real device profiles before a user
 * does. Common failure modes the fleet has hit on iOS PWA:
 *
 *   - the bar is partially or fully below the visible viewport because
 *     it stacked with an outer chrome bar's safe-area inset
 *   - the title shrunk because a parent set html font-size < 16px and the
 *     title sized from rem
 *   - a sticky/fixed ancestor above the bar is also pulling
 *     env(safe-area-inset-top) — i.e. double safe-area
 *
 * The check runs on mount + once on resize (rAF-debounced). One console
 * warning per condition per element instance — not spammy. Production
 * builds short-circuit before any DOM measurement, so the cost is zero
 * outside dev.
 */
function isDevBuild(): boolean {
  // process.env.NODE_ENV is replaced by every modern bundler at build
  // time; in production it becomes the literal string "production".
  try {
    const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
      .process;
    if (proc?.env?.NODE_ENV === "production") return false;
  } catch {
    /* ignore */
  }
  return true;
}

function findStickyAncestorAbove(el: HTMLElement): HTMLElement | null {
  let p: HTMLElement | null = el.parentElement;
  while (p && p !== document.body) {
    const cs = window.getComputedStyle(p);
    if (cs.position === "sticky" || cs.position === "fixed") {
      const pt = parseFloat(cs.paddingTop || "0");
      // Only flag when the ancestor actually paints safe-area-top (its
      // padding-top includes the inset). 44/47/59px Dynamic Island
      // values cover all current iOS notched devices.
      if (pt >= 20) return p;
    }
    p = p.parentElement;
  }
  return null;
}

function assertNavbarFits(el: HTMLElement): void {
  if (typeof window === "undefined" || !el.isConnected) return;
  const rect = el.getBoundingClientRect();
  const viewportH = window.innerHeight;
  if (rect.bottom > viewportH + 0.5) {
    // eslint-disable-next-line no-console
    console.warn(
      "[@etamong-playground/ui] <NavigationBar>: bottom edge is off-screen — " +
        `bar.bottom=${rect.bottom.toFixed(1)}px, viewport.h=${viewportH}px. ` +
        "Likely cause: an outer sticky/fixed bar already eats " +
        "env(safe-area-inset-top) and this <NavigationBar> stacks its " +
        "own. Pass safeAreaTop={false} to opt out, or hoist the bar.",
      el,
    );
  } else if (rect.bottom > viewportH - 1) {
    // Just barely clipped — same root cause, weaker signal.
    // eslint-disable-next-line no-console
    console.warn(
      "[@etamong-playground/ui] <NavigationBar>: bottom edge clipped by ~" +
        `${(rect.bottom - viewportH).toFixed(1)}px. ` +
        "Check for double safe-area stacking on iOS PWA.",
      el,
    );
  }
  const titleEl = el.querySelector<HTMLElement>(".etu-navbar-title");
  if (titleEl) {
    const fs = parseFloat(window.getComputedStyle(titleEl).fontSize || "0");
    if (fs > 0 && fs < 15.5) {
      // eslint-disable-next-line no-console
      console.warn(
        "[@etamong-playground/ui] <NavigationBar>: title font-size is " +
          `${fs.toFixed(1)}px, below the 16px floor. Root font-size ` +
          "may be set < 16px in your app's CSS. The bar uses px not " +
          "rem to insulate itself; check for an override.",
        titleEl,
      );
    }
  }
  const above = findStickyAncestorAbove(el);
  if (above) {
    // eslint-disable-next-line no-console
    console.warn(
      "[@etamong-playground/ui] <NavigationBar>: detected a sticky/fixed " +
        "ancestor with padding-top ≥ 20px above this bar. Both will " +
        "consume env(safe-area-inset-top) — pass safeAreaTop={false} " +
        "to this bar (or to the outer one) so the inset is only " +
        "applied once.",
      el,
      above,
    );
  }
}

export function NavigationBar({
  title,
  back,
  backLabel = "뒤로",
  leading,
  trailing,
  sticky = true,
  safeAreaTop = true,
  borderless = false,
  fadeOnScroll = true,
  ariaLabel,
  className,
}: NavigationBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!fadeOnScroll || typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fadeOnScroll]);

  // Dev-only proactive layout check. Eliminated from production bundles.
  useEffect(() => {
    if (!isDevBuild()) return;
    const el: HTMLElement | null = rootRef.current;
    if (!el) return;
    const target: HTMLElement = el;
    // Initial check after layout settles + on viewport resize. Two rAFs
    // so iOS PWA env() insets finish applying.
    let f1: number, f2: number;
    f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => assertNavbarFits(target));
    });
    let resizeT: ReturnType<typeof setTimeout> | undefined;
    function onResize() {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => assertNavbarFits(target), 150);
    }
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(f1);
      cancelAnimationFrame(f2);
      clearTimeout(resizeT);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const onBack = resolveBack(back);
  const cls =
    "etu-navbar etu-glass" +
    (sticky ? " etu-navbar--sticky" : "") +
    (sticky && !safeAreaTop ? " etu-navbar--no-safe-top" : "") +
    (borderless ? " etu-navbar--borderless" : "") +
    (fadeOnScroll && scrolled ? " etu-navbar--scrolled" : "") +
    (className ? " " + className : "");

  return (
    <header className={cls} role="banner" ref={rootRef}>
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
