/**
 * Fleet RUM init — the `@etamong-playground/ui/rum` subpath entry.
 *
 * Wraps @grafana/faro-web-sdk with the fleet policy from the planning ADR
 * `concepts/fleet-rum` (planning#1179): one browser SDK, no PII, lifecycle
 * breadcrumbs for crash-vs-discard classification, immediate (unbatched)
 * delivery so a discarded tab's last events still ship, and `ref`-code
 * correlation with the server-side error view.
 *
 * `@grafana/faro-web-sdk` is an OPTIONAL peer dependency — only RUM adopters
 * install it. Importing this subpath in an app that hasn't added the dep is a
 * missing-module resolution error; where that surfaces (build vs dev-server vs
 * runtime) is the consumer's bundler's call, so don't rely on it firing at any
 * particular phase — just don't import `./rum` unless you've added the SDK.
 */
import {
  faro,
  getWebInstrumentations,
  initializeFaro,
  type Faro,
} from "@grafana/faro-web-sdk";

let initialized = false;

export interface InitRumOptions {
  /** App name — the codename, matches the k8s `app` label (e.g. "meloetta"). */
  app: string;
  /** Build version, usually the short SHA (VITE_BUILD_SHA / deployInfo value). */
  version?: string;
  /**
   * The shared collector key (Vault `homelab/apps/faro/api-key`), delivered at
   * build time (e.g. `VITE_FARO_KEY`). Browser-public by design — an abuse
   * gate, not a secret.
   */
  apiKey: string;
  /** Collector endpoint. Default: the fleet faro.m collector. */
  endpoint?: string;
  /**
   * Session sampling rate 0–1 (default 1: homelab-scale traffic). A sampled-out
   * session sends nothing at all — errors included — so lower this only when
   * volume actually demands it.
   */
  sessionSampleRate?: number;
}

const DEFAULT_ENDPOINT = "https://faro.m.etamong.com/collect";

/**
 * Initialize fleet RUM. Call once from the app entry, before render. No-ops
 * outside a browser (SSR/tests) and on repeat calls, so it is safe to call
 * unconditionally. Never throws: an init failure is swallowed (RUM must not be
 * able to break the app's own boot) and reported to the console only.
 *
 * Never identifies the user: the wrapper exposes no `setUser` path, pushes no
 * user content, and disables Faro's console capture (which would otherwise
 * forward every `console.warn`/`console.error` argument — often PII — to the
 * shared collector). RUM events come from end-user browsers and land in the
 * shared Loki, unlike server logs there is no `user` field.
 */
export function initRum(opts: InitRumOptions): Faro | undefined {
  if (typeof window === "undefined") return undefined;
  if (initialized) return faro;

  try {
    // initializeFaro returns undefined when a Faro instance is already
    // registered on the page (e.g. an HMR re-eval re-runs this module with a
    // fresh `initialized=false` but the SDK's global guard persists). Bail
    // before wiring listeners so we never close over an undefined instance.
    const instance = initializeFaro({
      url: opts.endpoint ?? DEFAULT_ENDPOINT,
      apiKey: opts.apiKey,
      app: { name: opts.app, version: opts.version },
      sessionTracking: { samplingRate: opts.sessionSampleRate ?? 1 },
      // Unbatched: each signal ships immediately via fetch keepalive. The
      // batch path flushes on visibilitychange BEFORE app-level listeners run
      // and does nothing on pagehide, so a discarded PWA tab (the
      // planning#1176 evidence case) would lose exactly the lifecycle
      // breadcrumbs we need. Volume is a handful of small POSTs per session at
      // fleet scale — a fine trade for not losing the discard evidence.
      batching: { enabled: false },
      // captureConsole omitted → OFF: see the no-PII note above.
      instrumentations: getWebInstrumentations({ captureConsole: false }),
      // Faro stamps the live `location.href` onto `meta.page.url` for EVERY
      // event (exceptions, web vitals, our own breadcrumbs). On a URL like
      // /reset?token=…&email=… that query string would ship to the shared
      // collector on every event — so strip it here, the one hook that sees
      // all outbound items. (pushApiError strips its own `url` attr too.)
      beforeSend: (item) => {
        const page = item.meta.page;
        if (page?.url) page.url = stripQuery(page.url);
        return item;
      },
    });
    if (!instance) return faro;
    initialized = true;

    // Lifecycle breadcrumbs — the crash-vs-discard classifier: an OS tab
    // discard is preceded by hidden/freeze/pagehide events in the stream; a
    // crash reload is not. Driven off the `faro` singleton (not the local
    // `instance`) so a later duplicate init can't strand these on a stale ref.
    window.addEventListener("pagehide", () => {
      faro.api.pushEvent("page_lifecycle", { state: "pagehide" });
    });
    document.addEventListener("visibilitychange", () => {
      faro.api.pushEvent("page_lifecycle", { state: document.visibilityState });
    });
    // Page Lifecycle API — fired right before an OS freezes the tab; not
    // supported everywhere, harmless where not.
    document.addEventListener("freeze", () => {
      faro.api.pushEvent("page_lifecycle", { state: "frozen" });
    });

    return instance;
  } catch (err) {
    // RUM is best-effort; never let its init failure propagate into app boot.
    console.error("[rum] initRum failed", err);
    return undefined;
  }
}

/**
 * Report a failed API call, carrying the server's 8-hex `ref` so the client
 * event and the server's `request failed` log line share one Loki grep
 * surface (`|= "<ref>"`).
 *
 * Wire it as the `createFetch` error hook and every HttpError reports itself:
 *
 * ```ts
 * const api = createFetch({ onError: pushApiError });
 * ```
 *
 * Accepts any error; non-HttpError values are reported without ref/status.
 * No-op until `initRum` has run.
 *
 * HttpError is detected structurally, not with `instanceof`: this subpath is
 * bundled separately from the main entry, so the two would hold different
 * copies of the class and `instanceof` would silently never match.
 */
export function pushApiError(err: unknown): void {
  if (!initialized) return;
  const attrs: Record<string, string> = {};
  if (typeof err === "object" && err !== null && (err as Error).name === "HttpError") {
    const httpErr = err as { ref?: string; status?: number; url?: string };
    if (httpErr.ref) attrs.ref = httpErr.ref;
    if (httpErr.status !== undefined) attrs.status = String(httpErr.status);
    // Path only — the query string can carry tokens/emails (magic links,
    // verification), and this lands in the shared Loki.
    if (httpErr.url) attrs.url = stripQuery(httpErr.url);
  }
  if (err instanceof Error) attrs.message = err.message;
  faro.api.pushEvent("api_error", attrs);
}

/** Drop the query string (and fragment) from a URL, tolerating relative ones. */
function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}
