/**
 * Token-styled in-UI back button. Renders when there's somewhere to go —
 * either an in-app history entry behind the current one, or a `fallback`
 * the click should land on if there isn't.
 *
 * Canonical one-liner (recommended for almost all callers):
 *
 *   <BackButton fallback="/more" />               // hash / path routers
 *   <BackButton fallback={() => router.push("/more")} />  // Next.js etc.
 *
 * BackButton mounts `useInAppBack` internally when no `canGoBack`/`goBack`
 * props are passed, so consumers don't need to plumb the hook. The
 * explicit shape (own the hook, pass values in) is still supported:
 *
 *   const back = useInAppBack({ fallback: "/more" });
 *   <BackButton {...back} />
 *
 * Or a fully manual click handler:
 *
 *   <BackButton onClick={() => navigate(-1)} label="목록으로" />
 */

import type { ReactNode } from "react";
import {
  useInAppBack,
  type InAppBackFallback,
} from "./useInAppBack";

export interface BackButtonProps {
  /**
   * From `useInAppBack().canGoBack`. Omit if you're using the canonical
   * one-liner — BackButton mounts the hook internally.
   */
  canGoBack?: boolean;
  /**
   * From `useInAppBack().goBack`. Omit if you're using the canonical
   * one-liner — BackButton mounts the hook internally.
   */
  goBack?: () => void;
  /**
   * Direct click handler — use when you don't want to thread the hook
   * result through. If passed, takes precedence over `goBack`.
   */
  onClick?: () => void;
  /**
   * Where to go when there's no in-app history behind us (cold entry).
   * String → URL (pushState + popstate). Function → run as-is (typical
   * for Next.js: `() => router.push("/more")`). Used when no explicit
   * `goBack`/`onClick` is provided.
   */
  fallback?: InAppBackFallback;
  /** Default: "뒤로". */
  label?: string;
  /** Replace the default chevron-left glyph. */
  icon?: ReactNode;
  /** Extra class merged onto `etu-back-button`. */
  className?: string;
  /**
   * Render the button even when there's nowhere to go. Useful when the
   * caller wants a stable layout — the click is a no-op unless an
   * `onClick` / `goBack` / `fallback` is also wired.
   */
  alwaysShow?: boolean;
}

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function BackButton({
  canGoBack,
  goBack,
  onClick,
  fallback,
  label = "뒤로",
  icon,
  className,
  alwaysShow,
}: BackButtonProps) {
  // Always mount the internal hook (rules-of-hooks); only consult its
  // result when the caller didn't pass an explicit canGoBack/goBack pair.
  // `fallback` is forwarded so the internal hook's goBack does the right
  // thing on cold entries.
  const internal = useInAppBack({ fallback });
  const effectiveCanGoBack = canGoBack ?? internal.canGoBack;
  const handler = onClick ?? goBack ?? internal.goBack;
  const visible =
    alwaysShow ||
    effectiveCanGoBack ||
    !!onClick ||
    fallback !== undefined;
  if (!visible) return null;
  return (
    <button
      type="button"
      className={"etu-back-button" + (className ? " " + className : "")}
      onClick={handler}
      aria-label={label}
    >
      <span className="etu-back-button-icon">{icon ?? <DefaultIcon />}</span>
      <span className="etu-back-button-label">{label}</span>
    </button>
  );
}
