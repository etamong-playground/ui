/**
 * StatusBanner — a top-of-app banner that surfaces the current service status
 * declared from `service-admin`. Polls the per-host JSON endpoint at
 * `/.well-known/maintenance.json` (served by the Cloudflare Worker that fronts
 * every routed host) and renders a coloured strip when an incident is active.
 *
 * Same-origin by default — drop `<StatusBanner />` near the app root and the
 * banner appears for any non-`outage` incident that targets this host. (Outage
 * incidents take the origin offline and serve the 503 maintenance page
 * directly; nothing for this component to do.)
 *
 * Caller language is auto-picked from `document.documentElement.lang` — `ko`
 * for Korean, anything else for English (the JSON carries both copies).
 *
 * Renders null when the endpoint returns `enabled: false`, 404s (host not
 * managed), or errors — safe to mount unconditionally.
 */

import { useEffect, useState } from "react";
import { useStatusBanner, type StatusBannerData, type Severity } from "./useStatusBanner";

export type { Severity, StatusBannerData };

export interface StatusBannerProps {
  /** Override the polling endpoint. Default `/.well-known/maintenance.json`
   *  (same-origin). Use a cross-origin URL only for an embedded view of
   *  another fleet host's status; the worker endpoint sends `cache-control: max-age=30`. */
  endpoint?: string;
  /** Override the JSON poll interval (ms). Default 60_000 (the endpoint caches
   *  for 30s, so two polls/minute is the floor that's useful). */
  pollMs?: number;
  /** Force-pick a language; default reads `document.documentElement.lang`. */
  lang?: "ko" | "en";
  /** Override class on the outer banner. Merged with `etu-status-banner`. */
  className?: string;
  /** Render the dismiss "x" button. Dismissal lasts for the session only;
   *  a fresh banner of a different severity reappears. Default true. */
  dismissible?: boolean;
}

const SEVERITY_LABEL: Record<Severity, { ko: string; en: string }> = {
  outage: { ko: "장애", en: "Outage" },
  degraded: { ko: "일부 장애", en: "Degraded" },
  maintenance: { ko: "점검 중", en: "Maintenance" },
};

const pickLang = (override?: "ko" | "en"): "ko" | "en" => {
  if (override) return override;
  if (typeof document === "undefined") return "en";
  return (document.documentElement.lang || "").toLowerCase().startsWith("ko") ? "ko" : "en";
};

const sessionKey = (severity: Severity, updatedAt: string | null) =>
  `etu-status-banner-dismissed:${severity}:${updatedAt ?? ""}`;

export function StatusBanner({
  endpoint,
  pollMs,
  lang,
  className,
  dismissible = true,
}: StatusBannerProps) {
  const data = useStatusBanner({ endpoint, pollMs });
  const [dismissed, setDismissed] = useState(false);
  const sev = data?.severity;
  const updatedAt = data?.updated_at ?? null;

  // Reset session-dismissal when the underlying incident changes
  // (different severity or new updated_at means a new banner — show it again).
  useEffect(() => {
    if (!data || !data.enabled || !sev) return;
    try {
      const seen = sessionStorage.getItem(sessionKey(sev, updatedAt));
      setDismissed(seen === "1");
    } catch {
      setDismissed(false);
    }
  }, [data, sev, updatedAt]);

  // Outage incidents take origin offline — the 503 page renders instead, so
  // this component should have nothing to do. Defensive: never paint over.
  if (!data || !data.enabled || !sev || sev === "outage" || dismissed) return null;

  const effLang = pickLang(lang);
  const label = SEVERITY_LABEL[sev][effLang];
  const message = (effLang === "ko" ? data.message_ko : data.message_en) || (effLang === "ko" ? data.message_en : data.message_ko);
  const eta = data.eta_iso ? new Date(data.eta_iso) : null;
  const etaText =
    eta && !isNaN(eta.getTime())
      ? effLang === "ko"
        ? `복구 예정: ${eta.toLocaleString("ko-KR", { hour12: false })}`
        : `ETA: ${eta.toLocaleString(undefined, { hour12: false })}`
      : null;

  const onDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(sessionKey(sev, updatedAt), "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={["etu-status-banner", `etu-status-banner-${sev}`, className].filter(Boolean).join(" ")}
      data-severity={sev}
    >
      <span className="etu-status-banner-label">{label}</span>
      <span className="etu-status-banner-msg">{message}</span>
      {etaText && <span className="etu-status-banner-eta">{etaText}</span>}
      {dismissible && (
        <button
          type="button"
          className="etu-status-banner-close"
          aria-label={effLang === "ko" ? "닫기" : "Dismiss"}
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
}
