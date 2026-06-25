import { useEffect, useState, type ReactNode } from "react";

export type ToastKind = "ok" | "err" | "info";

export interface ToastItem {
  id: number;
  message: ReactNode;
  kind: ToastKind;
}

// Module-level pub/sub store: any module can call `toast(...)` without a
// provider/context; the single mounted <Toaster/> renders the queue.
let items: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();
let nextId = 1;

function emit() {
  for (const l of listeners) l(items);
}

/** Show a transient toast. Returns the id (so callers can dismiss early). */
export function toast(message: ReactNode, kind: ToastKind = "ok", durationMs = 3200): number {
  const id = nextId++;
  items = [...items, { id, message, kind }];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismissToast(id), durationMs);
  }
  return id;
}

/** Dismiss a toast by id. */
export function dismissToast(id: number): void {
  items = items.filter((t) => t.id !== id);
  emit();
}

/**
 * Mount once at the app root (alongside the router/shell). Renders the toast
 * queue bottom-center, styled from the @etamong-playground/ui tokens
 * (import "@etamong-playground/ui/styles.css").
 */
export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items);
  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="etu-toaster" role="status" aria-live="polite">
      {list.map((t) => (
        <div
          key={t.id}
          className={`etu-toast etu-toast-${t.kind}`}
          onClick={() => dismissToast(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
