/**
 * Viewport tier — fleet 3-tier breakpoint contract.
 *
 * See planning/wiki/concepts/responsive-3tier.md.
 *
 *   mobile  : <  720px  — <MobileTabBar> takes nav; <Sidebar> hidden
 *   tablet  : 720–1023  — <Sidebar tabletMode="rail"> default (icon-only
 *                         64px rail), or "drawer" (overlay + scrim)
 *   desktop : ≥ 1024px  — <Sidebar> full width
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DESKTOP_MIN,
  TABLET_MIN,
  getViewport,
  tierForWidth,
  type ViewportTier,
} from "./viewportCore";

export {
  DESKTOP_MIN,
  TABLET_MIN,
  getViewport,
  noFlashViewportScript,
  type ViewportTier,
} from "./viewportCore";

const ViewportContext = createContext<ViewportTier | null>(null);

export function ViewportProvider({ children }: { children: ReactNode }) {
  const tier = useViewportInternal();
  return (
    <ViewportContext.Provider value={tier}>{children}</ViewportContext.Provider>
  );
}

function useViewportInternal(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>(() => getViewport());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const tabletMq = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const desktopMq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    function recompute() {
      const next = tierForWidth(window.innerWidth);
      setTier(next);
      document.documentElement.setAttribute("data-vp", next);
    }
    recompute();
    tabletMq.addEventListener("change", recompute);
    desktopMq.addEventListener("change", recompute);
    return () => {
      tabletMq.removeEventListener("change", recompute);
      desktopMq.removeEventListener("change", recompute);
    };
  }, []);

  return tier;
}

export function useViewport(): ViewportTier {
  const ctx = useContext(ViewportContext);
  const local = useViewportInternal();
  return ctx ?? local;
}
