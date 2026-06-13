/**
 * Polls the per-host status feed and returns the parsed banner state.
 * Lower-level than `<StatusBanner>` — use this when you want to render your
 * own UI (e.g. a header pill, a notifications page entry) instead of the
 * default banner strip.
 */

import { useEffect, useRef, useState } from "react";

export type Severity = "outage" | "degraded" | "maintenance";

export interface StatusBannerData {
  enabled: boolean;
  severity: Severity | null;
  message_ko: string;
  message_en: string;
  eta_iso: string | null;
  retry_after_seconds: number | null;
  tags: string[];
  updated_at: string | null;
}

export interface UseStatusBannerOptions {
  /** Endpoint to poll. Default `/.well-known/maintenance.json` (same-origin). */
  endpoint?: string;
  /** Poll interval in ms. Default 60_000 (the endpoint sends `max-age=30`, so
   *  a 60s tick guarantees the cached layer rotates between polls). */
  pollMs?: number;
}

const DEFAULT_ENDPOINT = "/.well-known/maintenance.json";
const DEFAULT_POLL_MS = 60_000;

/**
 * Returns the latest parsed status, or `null` while loading / on error.
 * Pauses polling while the document is hidden (visibilitychange) and resumes
 * with an immediate fetch when it returns to the foreground.
 */
export function useStatusBanner(opts: UseStatusBannerOptions = {}): StatusBannerData | null {
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const pollMs = opts.pollMs ?? DEFAULT_POLL_MS;
  const [data, setData] = useState<StatusBannerData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(endpoint, { credentials: "omit", signal: ctrl.signal });
        if (!res.ok) {
          if (!cancelled) setData(null);
          return;
        }
        const body = (await res.json()) as Partial<StatusBannerData>;
        if (cancelled) return;
        setData({
          enabled: !!body.enabled,
          severity: (body.severity ?? null) as Severity | null,
          message_ko: body.message_ko ?? "",
          message_en: body.message_en ?? "",
          eta_iso: body.eta_iso ?? null,
          retry_after_seconds: body.retry_after_seconds ?? null,
          tags: Array.isArray(body.tags) ? body.tags : [],
          updated_at: body.updated_at ?? null,
        });
      } catch {
        // Network / abort / parse errors: leave previous data in place so a
        // flaky network doesn't flap the banner.
      }
    };

    const schedule = () => {
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (typeof document === "undefined" || !document.hidden) {
          await tick();
        }
        schedule();
      }, pollMs);
    };

    const onVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) void tick();
    };

    void tick();
    schedule();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisible);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      abortRef.current?.abort();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  }, [endpoint, pollMs]);

  return data;
}
