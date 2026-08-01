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
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useViewport } from "./viewport";

export interface NotificationBellItem {
  id: string;
  /** Rendered as a single row in the panel. */
  content: ReactNode;
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
}

function BellIcon() {
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
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [computedPlacement, setComputedPlacement] = useState(placement);
  // Fixed-position coordinates for the row variant's portaled popover — it
  // renders on <body>, outside the sidebar's own `overflow: auto`, so it
  // can't rely on `position: absolute` relative to an ancestor like the
  // trigger variant does.
  const [portalRect, setPortalRect] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const badge = count ?? items.length;
  const badgeText = badge > 99 ? "99+" : String(badge);
  const isRow = variant === "row";

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

  useEffect(() => {
    if (!open || isMobile) {
      setComputedPlacement(placement);
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = 360;
    const menuH = 420;
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
    setComputedPlacement(`${v}-${h}` as typeof placement);
  }, [open, placement, isMobile]);

  // Row variant only: recompute the portaled popover's viewport-fixed
  // coordinates from the trigger's rect whenever it might move.
  useEffect(() => {
    if (!isRow || !open || isMobile) {
      setPortalRect(null);
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;
    function recompute() {
      const rect = trigger!.getBoundingClientRect();
      const [v, h] = computedPlacement.split("-") as ["top" | "bottom", "left" | "right"];
      const next: { top?: number; bottom?: number; left?: number; right?: number } = {};
      if (v === "top") next.bottom = window.innerHeight - rect.top + 8;
      else next.top = rect.bottom + 8;
      if (h === "right") next.right = Math.max(8, window.innerWidth - rect.right);
      else next.left = rect.left;
      setPortalRect(next);
    }
    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [isRow, open, isMobile, computedPlacement]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open || !isMobile || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const close = () => setOpen(false);

  const trigger = isRow ? (
    <button
      ref={triggerRef}
      type="button"
      className={"etu-sidebar-item" + (open ? " etu-sidebar-item--active" : "")}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={
        badge > 0 ? `${typeof label === "string" ? label : ariaLabel} (${badge})` : undefined
      }
      onClick={() => setOpen((o) => !o)}
    >
      <span className="etu-sidebar-item-icon" aria-hidden>
        {icon ?? <BellIcon />}
        {badge > 0 ? <span className="etu-sidebar-item-badge-dot" aria-hidden /> : null}
      </span>
      <span className="etu-sidebar-item-label">{label}</span>
      {badge > 0 ? (
        <span className="etu-sidebar-item-badge" aria-hidden>
          {badgeText}
        </span>
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
      aria-label={badge > 0 ? `${ariaLabel} (${badge})` : ariaLabel}
      onClick={() => setOpen((o) => !o)}
    >
      {icon ?? <BellIcon />}
      {badge > 0 && (
        <span className="etu-notif-bell-badge" aria-hidden="true">
          {badgeText}
        </span>
      )}
    </button>
  );

  const panel =
    open && isMobile ? (
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
          />
        </div>
      </>
    ) : open && !isMobile && (!isRow || portalRect) ? (
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label={typeof title === "string" ? title : undefined}
        className={`etu-notif-bell-popover etu-notif-bell-popover--${computedPlacement}`}
        style={isRow && portalRect ? { position: "fixed", ...portalRect } : undefined}
      >
        <NotifPanelBody
          title={title}
          items={items}
          emptyMessage={emptyMessage}
          footer={footer}
          onClose={close}
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
      {isRow && typeof document !== "undefined" ? createPortal(panel, document.body) : panel}
    </div>
  );
}

function NotifPanelBody({
  title,
  items,
  emptyMessage,
  footer,
  onClose,
}: {
  title: ReactNode;
  items: NotificationBellItem[];
  emptyMessage: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
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
