/**
 * Friendly full-page error surface — what users see after a 5xx, an unhandled
 * exception, or a `Not Found` fallback. Pairs with the `httperr`/ref pattern
 * (planning concepts/user-facing-error-messages): the clean message goes in
 * front of the user, the `ref` code is shown discreetly so the user can quote
 * it when reporting.
 *
 * Hard rule: no repo URLs / file paths / MR numbers / stack traces leak through
 * here (planning concepts/no-repo-exposure). If callers pass an `error` value
 * we use only its `message` field, and only when explicitly opted into via
 * `showErrorMessage` — otherwise it stays in the logs.
 *
 * Mount it from your error boundary or a top-level `error.tsx` (Next.js):
 *
 *   import { ErrorPage } from "@etamong-lab/ui";
 *   <ErrorPage
 *     title="문제가 발생했어요"
 *     description="잠시 후 다시 시도해 주세요."
 *     refCode={data?.ref}
 *     onRetry={() => reset()}
 *     onHome={() => router.push("/")}
 *   />
 */

import type { ReactNode } from "react";

export interface ErrorPageProps {
  /** Headline (e.g. "문제가 발생했어요"). */
  title?: string;
  /** A user-friendly sentence — what happened + what to do. */
  description?: string;
  /**
   * The 8-hex `ref` code from the backend / log (the `httperr` reference). Shown
   * to the user so they can quote it in a report. Omit when there's no ref.
   */
  refCode?: string;
  /** Optional retry handler; renders a "다시 시도" button when set. */
  onRetry?: () => void;
  /** Optional home handler; renders a "홈으로" button when set. */
  onHome?: () => void;
  /**
   * Override the labels on the buttons / ref line. Defaults are Korean.
   */
  labels?: Partial<{
    retry: string;
    home: string;
    refLabel: string;
  }>;
  /** Custom icon node (defaults to a circle-alert glyph). */
  icon?: ReactNode;
  /** Extra class merged with `etu-error-page`. */
  className?: string;
}

const DEFAULTS = {
  title: "문제가 발생했어요",
  description: "잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 아래 코드를 알려주세요.",
  retry: "다시 시도",
  home: "홈으로",
  refLabel: "ref",
};

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="42"
      height="42"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function ErrorPage({
  title = DEFAULTS.title,
  description = DEFAULTS.description,
  refCode,
  onRetry,
  onHome,
  labels,
  icon,
  className,
}: ErrorPageProps) {
  const retryLabel = labels?.retry ?? DEFAULTS.retry;
  const homeLabel = labels?.home ?? DEFAULTS.home;
  const refLabel = labels?.refLabel ?? DEFAULTS.refLabel;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={"etu-error-page" + (className ? " " + className : "")}
    >
      <div className="etu-error-page-card">
        <div className="etu-error-page-icon">{icon ?? <DefaultIcon />}</div>
        <h1 className="etu-error-page-title">{title}</h1>
        <p className="etu-error-page-body">{description}</p>
        {(onRetry || onHome) && (
          <div className="etu-error-page-actions">
            {onRetry && (
              <button type="button" className="etu-error-page-cta" onClick={onRetry}>
                {retryLabel}
              </button>
            )}
            {onHome && (
              <button type="button" className="etu-error-page-secondary" onClick={onHome}>
                {homeLabel}
              </button>
            )}
          </div>
        )}
        {refCode && (
          <p className="etu-error-page-ref">
            <span className="etu-error-page-ref-label">{refLabel}:</span>{" "}
            <code className="etu-error-page-ref-code">{refCode}</code>
          </p>
        )}
      </div>
    </div>
  );
}
