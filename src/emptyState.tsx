/**
 * `<EmptyState>` — the "nothing here yet" card. Every list/grid view in
 * the fleet has its own version; this is the consolidated one.
 *
 * Variants:
 *
 *   <EmptyState title="아직 사이트가 없어요"
 *               description="새 사이트를 만들어 시작해 보세요."
 *               action={<button onClick={onNew}>새 사이트</button>} />
 *
 *   <EmptyState compact title="결과 없음" description="검색어를 바꿔 보세요." />
 *
 * Token-styled (`--etu-*`), so it inherits dark/light automatically.
 * Marked `role="status"` for screen readers.
 */

import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Headline. */
  title: string;
  /** Optional one-line description. */
  description?: ReactNode;
  /** Optional CTA / footnote node (typically a button or a hint). */
  action?: ReactNode;
  /** Replace the default empty-box glyph. Pass `null` to omit. */
  icon?: ReactNode;
  /** Smaller padding + smaller type — for inline / sidebar usage. */
  compact?: boolean;
  /** Extra class merged with `etu-empty-state`. */
  className?: string;
}

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="38"
      height="38"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7l9-4 9 4" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
      <path d="M3 7l9 4 9-4" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact,
  className,
}: EmptyStateProps) {
  const cls = [
    "etu-empty-state",
    compact ? "etu-empty-state--compact" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const showIcon = icon !== null;
  return (
    <div role="status" className={cls}>
      {showIcon && (
        <div className="etu-empty-state-icon">{icon ?? <DefaultIcon />}</div>
      )}
      <div className="etu-empty-state-title">{title}</div>
      {description && (
        <div className="etu-empty-state-body">{description}</div>
      )}
      {action && <div className="etu-empty-state-actions">{action}</div>}
    </div>
  );
}
