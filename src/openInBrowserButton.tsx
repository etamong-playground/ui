/**
 * `<OpenInBrowserButton>` — open a URL in the system default browser from
 * inside an installed PWA shell. Renders an `<a target="_blank">` styled as a
 * button with an external-link glyph; on iOS and Android standalone PWAs that
 * natively pops the link out to Safari / Chrome rather than navigating away
 * the PWA window. Use this for links that don't belong inside the installed
 * shell: external docs, OAuth handoffs, payment providers, sibling fleet apps
 * the user hasn't installed yet, etc.
 *
 * `target="_blank"` already does the right thing on all modern PWAs; the
 * component exists so the affordance ("this leaves the app") is uniform
 * across the fleet instead of every app rolling its own icon button.
 */

import { type AnchorHTMLAttributes, type ReactNode } from "react";

export interface OpenInBrowserButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> {
  /** The URL to open. */
  href: string;
  /** Button label. Default: "브라우저에서 열기". */
  label?: string;
  /** Replace the default external-link glyph. Pass `null` to omit. */
  icon?: ReactNode;
  /**
   * Render only the icon (no label). Good for inline placement next to a URL
   * display or inside a toolbar.
   */
  iconOnly?: boolean;
  /** ARIA label when `iconOnly`. Default: same as `label`. */
  ariaLabel?: string;
  /**
   * Visual variant. `ghost` (default) = transparent button with border,
   * matches `<CopyButton>`. `primary` = filled accent.
   */
  variant?: "ghost" | "primary";
  /** Extra class merged with `etu-open-in-browser-button`. */
  className?: string;
}

function DefaultExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

export function OpenInBrowserButton({
  href,
  label = "브라우저에서 열기",
  icon,
  iconOnly,
  ariaLabel,
  variant = "ghost",
  className,
  ...rest
}: OpenInBrowserButtonProps) {
  const cls = [
    "etu-open-in-browser-button",
    `etu-open-in-browser-button--${variant}`,
    iconOnly ? "etu-open-in-browser-button--icon-only" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const showIcon = icon !== null;
  return (
    <a
      {...rest}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      aria-label={iconOnly ? ariaLabel ?? label : rest["aria-label"]}
    >
      {showIcon && (
        <span className="etu-open-in-browser-button-icon">
          {icon ?? <DefaultExternalIcon />}
        </span>
      )}
      {!iconOnly && (
        <span className="etu-open-in-browser-button-label">{label}</span>
      )}
    </a>
  );
}
