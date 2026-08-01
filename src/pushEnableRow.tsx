/**
 * `<PushEnableRow>` — the one presentational push-permission affordance
 * (planning#1140), used both inside `<NotificationBell>`'s popover (via its
 * `push` prop) and standalone on a settings page. No banner: this is a row,
 * meant to sit where the user already showed intent (opened the bell) or in
 * an explicit settings section — never a full-width strip.
 *
 * Renders per `usePushPermission()` state and nothing else:
 *  - `"default"` — the enable affordance (title + body + CTA button).
 *  - `"needs-install"` — the install-to-Home-Screen path, text-only (there
 *    is no programmatic iOS install prompt, same reason `<InstallBanner>`'s
 *    iOS branch has no button either).
 *  - `"denied"` — an explanation of how to re-enable from browser/site
 *    settings. No button — browsers never re-prompt after a denial, and a
 *    button that silently does nothing is worse than no button.
 *  - `"unsupported"` — renders `null`.
 *  - `"granted"` — renders `null` unless `showGrantedConfirmation`, in which
 *    case a quiet one-line confirmation (no CTA).
 */
import { useState, type ReactNode } from "react";
import { BellIcon } from "./notificationBell";
import type { UsePushPermissionResult } from "./pushPermission";

export interface PushEnableRowLabels {
  enableTitle?: ReactNode;
  enableBody?: ReactNode;
  enableCta?: string;
  installTitle?: ReactNode;
  installBody?: ReactNode;
  deniedTitle?: ReactNode;
  deniedBody?: ReactNode;
  grantedBody?: ReactNode;
}

const DEFAULT_LABELS: Required<PushEnableRowLabels> = {
  enableTitle: "알림을 받아보세요",
  enableBody: "새 소식이 오면 바로 알려드릴게요.",
  enableCta: "알림 켜기",
  installTitle: "홈 화면에 추가하면 알림을 받을 수 있어요",
  installBody: "공유 → \"홈 화면에 추가\"로 설치한 뒤 다시 시도해 주세요.",
  deniedTitle: "알림이 차단되어 있어요",
  deniedBody: "브라우저 또는 기기 설정에서 이 사이트의 알림 권한을 다시 허용해 주세요.",
  grantedBody: "알림이 켜져 있어요.",
};

/**
 * The aria-label suffix `<NotificationBell push>` appends while its setup
 * dot shows — kept here, next to the row's own copy, rather than
 * re-authored inline in `notificationBell.tsx`, so there's one place that
 * owns push-affordance Korean strings, not two that can drift apart.
 */
export const DEFAULT_SETUP_HINT_LABEL = "— 알림 설정 가능";

export interface PushEnableRowProps {
  /** The result of `usePushPermission()` — this component is a pure view over it. */
  permission: UsePushPermissionResult;
  /**
   * Fires once permission newly becomes `"granted"` via this row's button.
   * The package stops at permission — do the actual
   * `registration.pushManager.subscribe(...)` + your `/api/push/subscribe`
   * POST here, app-side.
   */
  onEnabled?: () => void;
  /** Show a quiet one-line confirmation for `"granted"` instead of rendering nothing. Default `false`. */
  showGrantedConfirmation?: boolean;
  /** Override the leading icon. Defaults to the bell glyph; pass `null` to omit. */
  icon?: ReactNode;
  labels?: PushEnableRowLabels;
  /** Extra class merged with `etu-push-row etu-push-row--<state>`. */
  className?: string;
}

export function PushEnableRow({
  permission,
  onEnabled,
  showGrantedConfirmation = false,
  icon,
  labels,
  className,
}: PushEnableRowProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [busy, setBusy] = useState(false);

  if (permission.state === "unsupported") return null;

  if (permission.state === "granted") {
    if (!showGrantedConfirmation) return null;
    return (
      <div className={rowClass("granted", className)} role="status">
        <span className="etu-push-row-icon" aria-hidden="true">
          {icon === null ? null : icon ?? <BellIcon />}
        </span>
        <p className="etu-push-row-body">{l.grantedBody}</p>
      </div>
    );
  }

  if (permission.state === "needs-install") {
    return (
      <div className={rowClass("install", className)}>
        <span className="etu-push-row-icon" aria-hidden="true">
          {icon === null ? null : icon ?? <BellIcon />}
        </span>
        <div className="etu-push-row-text">
          <p className="etu-push-row-title">{l.installTitle}</p>
          <p className="etu-push-row-body">{l.installBody}</p>
        </div>
      </div>
    );
  }

  if (permission.state === "denied") {
    return (
      <div className={rowClass("denied", className)}>
        <span className="etu-push-row-icon" aria-hidden="true">
          {icon === null ? null : icon ?? <BellIcon />}
        </span>
        <div className="etu-push-row-text">
          <p className="etu-push-row-title">{l.deniedTitle}</p>
          <p className="etu-push-row-body">{l.deniedBody}</p>
        </div>
      </div>
    );
  }

  // state === "default"
  async function handleEnable() {
    // Guard re-entrancy in the handler itself (belt-and-braces alongside
    // `usePushPermission().prompt()`'s own in-flight guard) — needed
    // because `aria-disabled` (unlike native `disabled`) doesn't stop the
    // click event from firing.
    if (busy) return;
    setBusy(true);
    try {
      const result = await permission.prompt();
      if (result === "granted") onEnabled?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={rowClass("enable", className)}>
      <span className="etu-push-row-icon" aria-hidden="true">
        {icon === null ? null : icon ?? <BellIcon />}
      </span>
      <div className="etu-push-row-text">
        <p className="etu-push-row-title">{l.enableTitle}</p>
        <p className="etu-push-row-body">{l.enableBody}</p>
      </div>
      <button
        type="button"
        className="etu-push-row-cta"
        onClick={handleEnable}
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
      >
        {l.enableCta}
      </button>
    </div>
  );
}

function rowClass(variant: string, extra?: string): string {
  return `etu-push-row etu-push-row--${variant}` + (extra ? ` ${extra}` : "");
}
