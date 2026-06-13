/**
 * `<CopyButton>` + `useClipboard()` — for the secret-reveal, token-copy,
 * slug-copy, ref-code-copy moments that every app has. Pairs with the
 * package's `toast()` for a "복사됨" confirmation.
 *
 * Falls back to a hidden `<textarea>` + `document.execCommand("copy")`
 * when `navigator.clipboard` isn't available (older mobile / non-https
 * contexts).
 */

import { useCallback, useState, type ReactNode } from "react";
import { toast } from "./toast";

async function writeClipboard(value: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // fall through to legacy path
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export interface UseClipboardOptions {
  /** Default: 1500ms. How long `copied` stays true after a successful copy. */
  resetMs?: number;
  /** Toast text on success. Default: "복사됨". Pass `null` to suppress. */
  toastOnSuccess?: string | null;
  /** Toast text on failure. Default: "복사 실패". Pass `null` to suppress. */
  toastOnError?: string | null;
}

export interface UseClipboardResult {
  copied: boolean;
  copy: (value: string) => Promise<boolean>;
}

export function useClipboard(opts: UseClipboardOptions = {}): UseClipboardResult {
  const { resetMs = 1500, toastOnSuccess = "복사됨", toastOnError = "복사 실패" } =
    opts;
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      const ok = await writeClipboard(value);
      if (ok) {
        setCopied(true);
        if (toastOnSuccess) toast(toastOnSuccess, "ok");
        window.setTimeout(() => setCopied(false), resetMs);
      } else {
        if (toastOnError) toast(toastOnError, "err");
      }
      return ok;
    },
    [resetMs, toastOnSuccess, toastOnError],
  );

  return { copied, copy };
}

export interface CopyButtonProps extends UseClipboardOptions {
  /** The string to copy on click. */
  value: string;
  /** Button label. Default: "복사" (switches to "복사됨" briefly after success). */
  label?: string;
  /** Label shown right after a successful copy. Default: "복사됨". */
  successLabel?: string;
  /** Replace the default copy glyph. Pass `null` to omit. */
  icon?: ReactNode;
  /** Extra class merged with `etu-copy-button`. */
  className?: string;
  /**
   * Render only the icon (no label). Good for inline placement next to a
   * value display.
   */
  iconOnly?: boolean;
  /** ARIA label when `iconOnly`. Default: "복사". */
  ariaLabel?: string;
}

function DefaultCopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DefaultCheckIcon() {
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function CopyButton({
  value,
  label = "복사",
  successLabel = "복사됨",
  icon,
  className,
  iconOnly,
  ariaLabel,
  resetMs,
  toastOnSuccess,
  toastOnError,
}: CopyButtonProps) {
  const { copied, copy } = useClipboard({ resetMs, toastOnSuccess, toastOnError });
  const cls = [
    "etu-copy-button",
    copied ? "etu-copy-button--copied" : "",
    iconOnly ? "etu-copy-button--icon-only" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const showIcon = icon !== null;
  return (
    <button
      type="button"
      className={cls}
      onClick={() => copy(value)}
      aria-label={iconOnly ? ariaLabel ?? label : undefined}
      data-copied={copied || undefined}
    >
      {showIcon && (
        <span className="etu-copy-button-icon">
          {icon ?? (copied ? <DefaultCheckIcon /> : <DefaultCopyIcon />)}
        </span>
      )}
      {!iconOnly && (
        <span className="etu-copy-button-label">
          {copied ? successLabel : label}
        </span>
      )}
    </button>
  );
}
