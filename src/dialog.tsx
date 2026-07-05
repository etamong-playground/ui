import { useEffect, useRef, useState, type ReactNode } from "react";

interface BaseReq {
  title?: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
}
interface ConfirmReq extends BaseReq {
  kind: "confirm";
  danger?: boolean;
  resolve: (ok: boolean) => void;
}
interface PromptReq extends BaseReq {
  kind: "prompt";
  placeholder?: string;
  defaultValue?: string;
  resolve: (value: string | null) => void;
}
type Req = ConfirmReq | PromptReq;

// Default button labels follow the app locale (fleet rule: user-facing = KO+EN).
// <html lang> is kept in sync by I18nProvider / setLocale / the no-flash snippet,
// so this works without any provider or appKey plumbing.
function defaultLabels(): { cancel: string; confirm: string } {
  const ko =
    typeof document !== "undefined" &&
    document.documentElement.lang.toLowerCase().startsWith("ko");
  return ko ? { cancel: "취소", confirm: "확인" } : { cancel: "Cancel", confirm: "OK" };
}

// Module-level: one pending dialog at a time, no provider needed.
let current: Req | null = null;
const listeners = new Set<(r: Req | null) => void>();
function setReq(r: Req | null) {
  current = r;
  for (const l of listeners) l(r);
}

/** Promise-based confirm — replaces window.confirm(). Resolves true/false. */
export function uiConfirm(opts: Omit<ConfirmReq, "kind" | "resolve">): Promise<boolean> {
  return new Promise((resolve) => setReq({ kind: "confirm", ...opts, resolve }));
}

/** Promise-based prompt — replaces window.prompt(). Resolves the text or null. */
export function uiPrompt(opts: Omit<PromptReq, "kind" | "resolve">): Promise<string | null> {
  return new Promise((resolve) => setReq({ kind: "prompt", ...opts, resolve }));
}

/**
 * Mount once at the app root. Renders the pending uiConfirm/uiPrompt dialog with
 * Escape (cancel), Enter (confirm), and backdrop-click (cancel) handling. Styled
 * from the @etamong-playground/ui tokens (import "@etamong-playground/ui/styles.css").
 */
export function DialogHost() {
  const [req, setLocalReq] = useState<Req | null>(current);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listeners.add(setLocalReq);
    return () => {
      listeners.delete(setLocalReq);
    };
  }, []);

  useEffect(() => {
    if (req?.kind === "prompt") {
      setValue(req.defaultValue ?? "");
      // focus after paint
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [req]);

  if (!req) return null;

  const cancel = () => {
    if (req.kind === "prompt") req.resolve(null);
    else req.resolve(false);
    setReq(null);
  };
  const confirm = () => {
    if (req.kind === "prompt") req.resolve(value);
    else req.resolve(true);
    setReq(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter" && req.kind === "confirm") {
      e.preventDefault();
      confirm();
    }
  };

  return (
    <div
      className="etu-dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
      onKeyDown={onKeyDown}
    >
      <div className="etu-dialog" role="dialog" aria-modal="true">
        {req.title ? <div className="etu-dialog-title">{req.title}</div> : null}
        {req.body ? <div className="etu-dialog-body">{req.body}</div> : null}
        {req.kind === "prompt" ? (
          <input
            ref={inputRef}
            className="etu-dialog-input"
            value={value}
            placeholder={req.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirm();
              }
            }}
          />
        ) : null}
        <div className="etu-dialog-actions">
          <button className="etu-dialog-btn" onClick={cancel}>
            {req.cancelLabel ?? defaultLabels().cancel}
          </button>
          <button
            className={
              "etu-dialog-btn etu-dialog-btn-primary" +
              (req.kind === "confirm" && req.danger ? " etu-dialog-btn-danger" : "")
            }
            onClick={confirm}
          >
            {req.confirmLabel ?? defaultLabels().confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
