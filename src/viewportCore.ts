/**
 * React-free viewport primitives — safe to import from `helpers.ts`.
 * React provider/hook lives in `viewport.tsx`.
 */

export type ViewportTier = "mobile" | "tablet" | "desktop";

export const TABLET_MIN = 720;
export const DESKTOP_MIN = 1024;

export function tierForWidth(w: number): ViewportTier {
  if (w >= DESKTOP_MIN) return "desktop";
  if (w >= TABLET_MIN) return "tablet";
  return "mobile";
}

/** SSR-safe — returns "desktop" on the server. */
export function getViewport(): ViewportTier {
  if (typeof window === "undefined") return "desktop";
  return tierForWidth(window.innerWidth);
}

export const noFlashViewportScript: string =
  `(function(){try{var w=window.innerWidth||document.documentElement.clientWidth;var v="mobile";if(w>=${DESKTOP_MIN})v="desktop";else if(w>=${TABLET_MIN})v="tablet";document.documentElement.setAttribute("data-vp",v);}catch(e){}})();`;
