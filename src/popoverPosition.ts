/**
 * Shared popover/dropdown positioning for `<NotificationBell>` and
 * `<UserMenu>` — the side-flip decision (does the requested placement fit
 * the viewport?) and, for portaled panels, the viewport-fixed pixel
 * coordinates to render at.
 *
 * Side decision and portal offset are computed together in a single
 * `useLayoutEffect` pass, not two effects racing each other — the second
 * effect reading a stale `computedPlacement` from its own closure was the
 * bug (planning#1133 review): the panel would paint at a wrong position for
 * one frame before correcting. `useLayoutEffect` runs before the browser
 * paints, so even the two-render measure-then-place sequence below (first
 * render mounts the panel off-screen so it can be measured, the layout
 * effect then repositions it) never flashes.
 *
 * The panel's actual rendered size drives the decision once it can be
 * measured (`panelRef`) — not a hardcoded constant that can drift from the
 * component's own CSS (e.g. a JS `menuH` that doesn't match the stylesheet's
 * `max-height`). `fallbackSize` is only a pre-measurement placeholder.
 */
import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export type PopoverPlacement = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface UsePopoverPositionOptions {
  open: boolean;
  /** Set `false` to skip positioning entirely (e.g. mobile sheet mode). */
  enabled: boolean;
  placement: PopoverPlacement;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  /**
   * Render the panel through a portal with viewport-fixed pixel coordinates
   * instead of relying on `position: absolute` relative to an ancestor.
   * Required whenever the panel is portaled to `document.body` (escaping an
   * `overflow` ancestor like `<Sidebar>`).
   */
  portal?: boolean;
  /** Viewport margin kept clear on every edge, both axes. Default: 8. */
  margin?: number;
  /** Used only until the panel exists and can be measured directly. */
  fallbackSize?: { width: number; height: number };
}

export interface UsePopoverPositionResult {
  computedPlacement: PopoverPlacement;
  /** Inline style for the portaled panel. `undefined` when `portal` is false. */
  portalStyle: CSSProperties | undefined;
}

const DEFAULT_FALLBACK = { width: 360, height: 420 };

/**
 * Style for a portaled panel BEFORE its first measurement — mounted so it
 * can be measured (see the module doc comment), but not yet positioned.
 * Must explicitly neutralize `right`/`bottom` too, not just set `top`/
 * `left`: the panel's CSS placement class (e.g. `--top-right`) may set
 * `bottom` (and/or `right`), and a `position: fixed` box with an auto
 * height but BOTH `top` and `bottom` non-auto has its height *computed*
 * from that gap instead of its content — corrupting the very measurement
 * this pass exists to take.
 */
export const POPOVER_MEASURING_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: "auto",
  bottom: "auto",
  visibility: "hidden",
  pointerEvents: "none",
};

export function usePopoverPosition({
  open,
  enabled,
  placement,
  triggerRef,
  panelRef,
  portal = false,
  margin = 8,
  fallbackSize = DEFAULT_FALLBACK,
}: UsePopoverPositionOptions): UsePopoverPositionResult {
  const [computedPlacement, setComputedPlacement] = useState<PopoverPlacement>(placement);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | undefined>(undefined);

  useLayoutEffect(() => {
    if (!open || !enabled) {
      setComputedPlacement(placement);
      setPortalStyle(undefined);
      return;
    }
    if (typeof window === "undefined") return;

    function recompute() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      // `clientWidth`/`clientHeight` are the content-viewport, excluding the
      // classic scrollbar gutter that `window.innerWidth` includes — matches
      // what `getBoundingClientRect()` is relative to.
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const measured = panelRef.current?.getBoundingClientRect();
      const menuW = measured?.width || fallbackSize.width;
      const menuH = measured?.height || fallbackSize.height;

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

      setComputedPlacement(`${v}-${h}` as PopoverPlacement);

      if (!portal) return;

      let top = v === "top" ? rect.top - margin - menuH : rect.bottom + margin;
      let left = h === "right" ? rect.right - menuW : rect.left;
      // Clamp BOTH axes so the whole panel — not just its anchor edge —
      // stays within the viewport with the same margin on every side.
      top = Math.min(Math.max(top, margin), Math.max(margin, vh - menuH - margin));
      left = Math.min(Math.max(left, margin), Math.max(margin, vw - menuW - margin));

      setPortalStyle({ position: "fixed", top, left, right: "auto", bottom: "auto" });
    }

    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
    // `fallbackSize` is destructured to its two primitives rather than kept
    // as an object dependency — an inline object literal at the call site
    // (a very easy footgun, since it's a plain options object, not memoized)
    // would otherwise get a new identity every render and re-run this effect
    // — including its `setState` calls — on every render, forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, enabled, placement, portal, margin, fallbackSize.width, fallbackSize.height, triggerRef, panelRef]);

  return { computedPlacement, portalStyle };
}
