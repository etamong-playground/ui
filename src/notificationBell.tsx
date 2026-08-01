/**
 * `<NotificationBell>` — fleet-wide notification surface.
 *
 * A bell-icon trigger with an unread badge. On desktop / tablet, click opens
 * a popover dropdown anchored to the trigger (mirrors `<UserMenu>` placement
 * conventions). On mobile, click opens a bottom sheet sliding up from the
 * viewport edge — the iOS-native pattern. Consumers pass an `items` array
 * and the component handles open/close, focus, Escape, and backdrop dismiss.
 *
 * Designed to replace per-app "inbox" tabs / routes: incoming notifications
 * (access requests, deploy completions, mentions) belong on a global bell,
 * not in the primary nav. The component is content-agnostic — consumers
 * render each item's body and any inline actions.
 *
 * **Placement convention (v0.43):** the bell is a `<Sidebar>` nav row
 * (`variant="row"`, mounted via `SidebarItem.render`) on tablet/desktop, or
 * `<NavigationBar trailing>` on mobile (the sidebar is hidden below 720px).
 * Never the sidebar footer — that's identity-only now — and never paired
 * with the theme toggle (which lives inside `<UserMenu themeToggle>`).
 *
 * **Mobile sheet is portaled (v0.45, planning#1151):** the default
 * `variant="trigger"`'s mobile sheet + backdrop render through a portal to
 * `document.body`, same as the row variant's popover. `<NavigationBar>`
 * always applies `backdrop-filter` (`.etu-glass`), which — like `transform`/
 * `filter` — makes it a containing block for `position: fixed` descendants;
 * without the portal, a bell mounted in `<NavigationBar trailing>` had its
 * sheet anchored to the header instead of the viewport.
 *
 * **Push-permission affordance (v0.44, planning#1140):** pass the optional
 * `push` prop to opt into a `<PushEnableRow>` at the top of the popover/sheet
 * when `push.permission.state === "default"` — the user just opened the
 * bell, so intent is already demonstrated, no cold interruption. The same
 * state also drives a quiet hollow-dot indicator on the trigger, distinct
 * from the filled unread badge (one nudge, not a recurring nag — it
 * disappears the moment the user decides, either way). Omitting `push`
 * leaves the component exactly as before.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { POPOVER_MEASURING_STYLE, usePopoverPosition } from "./popoverPosition";
import { DEFAULT_SETUP_HINT_LABEL, PushEnableRow, type PushEnableRowLabels } from "./pushEnableRow";
import type { UsePushPermissionResult } from "./pushPermission";
import { useViewport } from "./viewport";

export interface NotificationBellItem {
  id: string;
  /** Rendered as a single row in the panel. */
  content: ReactNode;
}

export interface NotificationBellPushProps {
  /** Pass through `usePushPermission()`'s result verbatim. */
  permission: UsePushPermissionResult;
  /** Fires once permission is newly granted via the row's button — subscribe app-side from here. */
  onEnabled?: () => void;
  /** Override the row's copy for any state. */
  labels?: PushEnableRowLabels;
}

export interface NotificationBellProps {
  items: NotificationBellItem[];
  /**
   * Override the badge count. Defaults to `items.length`. Pass when the
   * server-side pending count is higher than what's currently rendered
   * (paginated list, partial fetch).
   */
  count?: number;
  /** Called when the panel opens — use to refresh `items`. */
  onOpen?: () => void;
  /** Aria label for the trigger button. Default: `"알림"`. */
  ariaLabel?: string;
  /** Title shown at the top of the panel. Default: `"알림"`. */
  title?: ReactNode;
  /** Empty-state body when `items` is empty. Default: `"새 알림이 없습니다."`. */
  emptyMessage?: ReactNode;
  /** Optional footer — typically a "View all" link or "Mark all read". */
  footer?: ReactNode;
  /** Custom trigger icon — defaults to a bell SVG. */
  icon?: ReactNode;
  /** Extra class merged with `etu-notif-bell`. */
  className?: string;
  /**
   * Preferred placement of the desktop dropdown. Default: `"bottom-right"`.
   * Auto-flips on open when the requested side doesn't fit, same contract
   * as `<UserMenu>`. Ignored on mobile (always bottom sheet).
   */
  placement?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /**
   * Presentation. `"trigger"` (default) is the standalone icon-button,
   * sized for a header/toolbar — unchanged from prior versions. `"row"`
   * (v0.43) renders as a full-width `.etu-sidebar-item` row (icon + `label`
   * + count) meant to be mounted via `SidebarItem.render`:
   *
   * ```tsx
   * { id: "notifications", render: () => (
   *     <NotificationBell variant="row" label={t.nav.notifications} items={items} />
   * ) }
   * ```
   *
   * Reuses the same `.etu-sidebar-item*` classes `<Sidebar>` itself uses,
   * so it inherits rail-collapse (icon-only, badge → dot) for free. The
   * desktop popover renders through a portal so it isn't clipped by the
   * sidebar's own `overflow: auto` — same visual result as the trigger
   * variant, just anchored via computed viewport coordinates instead of
   * `position: absolute` relative to an ancestor.
   */
  variant?: "trigger" | "row";
  /** Row-variant label. Ignored in `"trigger"` variant. Default: `"알림"`. */
  label?: ReactNode;
  /**
   * Opt-in push-permission affordance (v0.44, planning#1140). See the
   * component doc comment above. Undefined (the default) leaves
   * `NotificationBell` unchanged.
   */
  push?: NotificationBellPushProps;
}

/** Exported so `PushEnableRow`'s default icon matches the bell it lives under. */
export function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificationBell({
  items,
  count,
  onOpen,
  ariaLabel = "알림",
  title = "알림",
  emptyMessage = "새 알림이 없습니다.",
  footer,
  icon,
  className,
  placement = "bottom-right",
  variant = "trigger",
  label = "알림",
  push,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const badge = count ?? items.length;
  const badgeText = badge > 99 ? "99+" : String(badge);
  const isRow = variant === "row";
  // Only "default" — not "needs-install"/"denied" — earns the nudge. Those
  // two states already required the user to act (install) or were declined
  // (denied); re-showing a dot there would be exactly the "recurring nag"
  // the design doc rules out.
  const showSetupDot = push?.permission.state === "default";

  useEffect(() => {
    if (!open) return;
    onOpen?.();
    // onOpen identity intentionally omitted — callers commonly inline an
    // arrow; we just want the side effect on each open transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The mobile sheet/backdrop (below) are `position: fixed`, and a fixed
  // descendant's containing block is the viewport UNLESS some ancestor
  // establishes one — `backdrop-filter` does that, same as `transform`/
  // `filter`/`perspective` (planning#1151). `<NavigationBar>` always applies
  // `.etu-glass` (backdrop-filter), so a non-portaled trigger mounted in its
  // `trailing` slot had its sheet anchored to the header instead of the
  // viewport. The desktop popover doesn't need this: it's `position:
  // absolute` against `.etu-notif-bell` (`position: relative`, closer in the
  // tree than any `.etu-glass` ancestor), which already wins the
  // containing-block search regardless of backdrop-filter further out.
  const shouldPortal = isRow || isMobile;
  const { computedPlacement, portalStyle } = usePopoverPosition({
    open,
    enabled: !isMobile,
    placement,
    triggerRef,
    panelRef,
    portal: isRow,
  });

  // The sidebar is CSS-hidden below 720px (`display: none`), not unmounted —
  // a row-variant instance opened at tablet/desktop width stays mounted and
  // `open` when the viewport crosses into mobile. Without this it would fall
  // into the `isMobile` branch below and render a full-screen sheet the user
  // never asked for, portaled outside the (hidden) sidebar. Force it closed
  // instead of relying on the app to unmount the sidebar.
  useEffect(() => {
    if (isRow && isMobile) setOpen(false);
  }, [isRow, isMobile]);

  // Lock body scroll while the mobile sheet is open. Never for the row
  // variant — it has no mobile sheet (see above), so it must never engage
  // this lock even for the one commit before the effect above flushes.
  useEffect(() => {
    if (!open || !isMobile || isRow || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile, isRow]);

  const close = () => setOpen(false);

  const rowLabelText = typeof label === "string" ? label : ariaLabel;
  // Mirrors the `badge > 0` treatment below — without this, the setup dot
  // is a purely visual nudge (see the `aria-hidden` spans it renders) that
  // sighted users get and screen-reader users structurally can't, since
  // they'd only ever encounter the enable row by opening the panel for an
  // unrelated reason.
  const setupHint = showSetupDot ? ` ${DEFAULT_SETUP_HINT_LABEL}` : "";
  const trigger = isRow ? (
    <button
      ref={triggerRef}
      type="button"
      className={"etu-sidebar-item" + (open ? " etu-sidebar-item--active" : "")}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={(badge > 0 ? `${rowLabelText} (${badgeText})` : rowLabelText) + setupHint}
      title={rowLabelText}
      onClick={() => setOpen((o) => !o)}
    >
      <span className="etu-sidebar-item-icon" aria-hidden>
        {icon ?? <BellIcon />}
        {badge > 0 ? (
          <span className="etu-sidebar-item-badge-dot" aria-hidden />
        ) : showSetupDot ? (
          <span className="etu-sidebar-item-badge-dot etu-sidebar-item-badge-dot--setup" aria-hidden />
        ) : null}
      </span>
      <span className="etu-sidebar-item-label">{label}</span>
      {badge > 0 ? (
        <span className="etu-sidebar-item-badge" aria-hidden>
          {badgeText}
        </span>
      ) : showSetupDot ? (
        <span className="etu-sidebar-item-badge etu-sidebar-item-badge--setup" aria-hidden />
      ) : null}
    </button>
  ) : (
    <button
      ref={triggerRef}
      type="button"
      className="etu-notif-bell-trigger"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={(badge > 0 ? `${ariaLabel} (${badge})` : ariaLabel) + setupHint}
      onClick={() => setOpen((o) => !o)}
    >
      {icon ?? <BellIcon />}
      {badge > 0 ? (
        <span className="etu-notif-bell-badge" aria-hidden="true">
          {badgeText}
        </span>
      ) : showSetupDot ? (
        <span className="etu-notif-bell-setup-dot" aria-hidden="true" />
      ) : null}
    </button>
  );

  // `!isRow` on the sheet branch is defense in depth alongside the
  // force-close effect above: the row variant must never take the
  // mobile-sheet branch, even for the one render before that effect's
  // `setOpen(false)` commits.
  const panel =
    open && isMobile && !isRow ? (
      <>
        <div className="etu-notif-bell-backdrop" onMouseDown={close} aria-hidden="true" />
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : undefined}
          className="etu-notif-bell-sheet"
        >
          <div className="etu-notif-bell-sheet-grabber" aria-hidden="true" />
          <NotifPanelBody
            title={title}
            items={items}
            emptyMessage={emptyMessage}
            footer={footer}
            onClose={close}
            push={push}
          />
        </div>
      </>
    ) : open && !isMobile ? (
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label={typeof title === "string" ? title : undefined}
        className={`etu-notif-bell-popover etu-notif-bell-popover--${computedPlacement}`}
        style={portalStyle ?? (isRow ? POPOVER_MEASURING_STYLE : undefined)}
      >
        <NotifPanelBody
          title={title}
          items={items}
          emptyMessage={emptyMessage}
          footer={footer}
          onClose={close}
          push={push}
        />
      </div>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={
        "etu-notif-bell" +
        (isRow ? " etu-notif-bell--row" : "") +
        (className ? " " + className : "")
      }
    >
      {trigger}
      {shouldPortal && typeof document !== "undefined" ? createPortal(panel, document.body) : panel}
    </div>
  );
}

function NotifPanelBody({
  title,
  items,
  emptyMessage,
  footer,
  onClose,
  push,
}: {
  title: ReactNode;
  items: NotificationBellItem[];
  emptyMessage: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  push?: NotificationBellPushProps;
}) {
  return (
    <>
      <div className="etu-notif-bell-header">
        <span className="etu-notif-bell-title">{title}</span>
        <button
          type="button"
          className="etu-notif-bell-close"
          aria-label="닫기"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {push ? (
        <PushEnableRow
          permission={push.permission}
          onEnabled={push.onEnabled}
          labels={push.labels}
        />
      ) : null}
      <div className="etu-notif-bell-items">
        {items.length === 0 ? (
          <div className="etu-notif-bell-empty">{emptyMessage}</div>
        ) : (
          items.map((it) => (
            <div key={it.id} className="etu-notif-bell-item">
              {it.content}
            </div>
          ))
        )}
      </div>
      {footer && <div className="etu-notif-bell-footer">{footer}</div>}
    </>
  );
}
