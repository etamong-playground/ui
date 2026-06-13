/**
 * Token-styled in-UI back button. Renders only when the in-app history
 * stack has somewhere to go, OR when an `onExit` fallback is provided so
 * the button does something useful even on a cold entry.
 *
 * Usage:
 *
 *   const back = useInAppBack({ onExit: () => navigate("/") });
 *   <BackButton {...back} />
 *
 * Or pass the handler directly:
 *
 *   <BackButton onClick={() => navigate(-1)} label="목록으로" />
 */

import type { ReactNode } from "react";

export interface BackButtonProps {
  /** Comes straight from `useInAppBack().canGoBack`. */
  canGoBack?: boolean;
  /** Comes straight from `useInAppBack().goBack`. */
  goBack?: () => void;
  /**
   * Direct click handler — use when you don't want to thread the hook
   * result through. If passed, takes precedence over `goBack`.
   */
  onClick?: () => void;
  /** Default: "뒤로". */
  label?: string;
  /** Replace the default chevron-left glyph. */
  icon?: ReactNode;
  /** Extra class merged onto `etu-back-button`. */
  className?: string;
  /**
   * Render the button even when `canGoBack` is false. Useful when the
   * caller wants a stable layout — the click is a no-op unless an
   * `onClick` / `goBack` is also wired.
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
  label = "뒤로",
  icon,
  className,
  alwaysShow,
}: BackButtonProps) {
  const handler = onClick ?? goBack;
  const visible = alwaysShow || canGoBack || !!onClick;
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
