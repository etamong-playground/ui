/**
 * Service-worker helpers for the etamong-lab PWA recipe (planning
 * concepts/pwa-service-worker). Two pieces:
 *
 *  - `registerServiceWorker(url, opts)` — client-side registration with
 *    the update flow baked in: aggressive `registration.update()` checks
 *    (on load + visibilitychange + a slow interval), a "새 버전" toast on
 *    a waiting SW, and an auto-reload on `controllerchange`.
 *
 *  - `networkFirstSwSource({ version, navigateAllowlist })` — returns the
 *    canonical hand-rolled SW source as a string. Apps write it to
 *    `public/sw.js` (or generate it at build time). The recipe:
 *      • Never intercepts non-GET or `/api/*` (fresh auth + live state).
 *      • Navigation requests: **network-first** with a short timeout, cache
 *        as the offline fallback. So online users always see the latest
 *        deploy; offline still works.
 *      • Static assets: **network-first** with a short timeout too, cache
 *        as the offline fallback. Same bias toward "fresh wins".
 *      • Caches are versioned by `version`; on `activate` older versions
 *        are deleted, then `clients.claim()`.
 *      • The SW calls `skipWaiting()` immediately on `install` so updates
 *        propagate on the next nav.
 *
 *    This is the "online-first" preset. Apps with a tighter cache budget
 *    or a hand-rolled scoped strategy (minccino's specific endpoints, the
 *    shortener single-segment-route guard) should stick with their
 *    bespoke SW.
 */

import { toast } from "./toast";

export interface RegisterServiceWorkerOptions {
  /**
   * Show a "새 버전이 있어요" toast when a new SW finishes installing and
   * is waiting. Clicking it activates the new SW and reloads. Default: true.
   */
  notifyOnUpdate?: boolean;
  /**
   * Auto-activate the waiting SW + reload as soon as it's detected, with
   * no user prompt. Use when you don't care about transient state loss.
   * Default: false (the toast is the canonical path).
   */
  autoReloadOnUpdate?: boolean;
  /**
   * Override the toast text. Default: "새 버전이 준비됐어요. 새로고침할까요?".
   */
  updateToastText?: string;
  /**
   * Interval (ms) between background `registration.update()` calls — so
   * long-lived installed tabs catch new deploys without a reload. Default:
   * 2 minutes. Pass `0` to disable the interval (still updates on load
   * + visibilitychange).
   */
  updateIntervalMs?: number;
  /**
   * Service-worker `register()` options (typically `{ scope }`).
   */
  registerOptions?: RegistrationOptions;
  /**
   * Called when the new SW activates and the page is about to reload.
   * Last chance to persist transient state.
   */
  onActivate?: () => void;
  /**
   * The current build identifier — typically the deploy SHA from
   * `DeployInfo`. When supplied, a dev-mode assertion fires a
   * `console.warn` if this changes across reloads but the SW file body
   * is byte-for-byte identical. That signal means the SW source isn't
   * stamped per build, so browsers never observe a new SW and never
   * roll over to the new deploy — the canonical iOS PWA staleness
   * trigger (see planning concepts/pwa-cache-and-ios-shell and the
   * `viewport-fit-assertions` companion pattern).
   *
   * Dev-only — production short-circuits via `NODE_ENV === "production"`.
   */
  currentBuild?: string;
}

export interface ServiceWorkerHandle {
  /** The underlying registration once it resolves. */
  readonly registration: ServiceWorkerRegistration | null;
  /** True while a waiting SW exists (update available). */
  readonly hasUpdate: boolean;
  /** Force the waiting SW to take over + reload. No-op if no waiting SW. */
  applyUpdate: () => void;
  /** Manually trigger `registration.update()`. */
  checkForUpdate: () => Promise<void>;
  /** Unregister this SW. Useful in tests / when toggling off. */
  unregister: () => Promise<boolean>;
}

const DEFAULT_INTERVAL_MS = 2 * 60 * 1000;
const DEFAULT_TOAST_TEXT = "새 버전이 준비됐어요. 새로고침할까요?";

function isDevBuild(): boolean {
  try {
    const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
      .process;
    if (proc?.env?.NODE_ENV === "production") return false;
  } catch {
    /* ignore */
  }
  return true;
}

/** Cheap non-cryptographic hash of a string. Stable across runs / origins. */
function hashStr(s: string): string {
  // FNV-1a 32-bit — fast, no deps.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}

const SW_STALENESS_STORAGE = "@etamong-playground/ui:sw-staleness";

interface StalenessRecord {
  url: string;
  swHash: string;
  build: string;
  observedAt: number;
}

/**
 * Dev-only: fetch the SW URL, compute a body hash, compare with the
 * previously-observed value at the previously-observed build. Warn if the
 * build identifier changed but the SW hash did not — that's the "browser
 * never observes a new SW after deploy" failure mode behind iOS PWA
 * staleness. One warning per detected event per session.
 */
async function assertSwChangesAcrossBuilds(
  url: string,
  currentBuild: string,
): Promise<void> {
  let body: string;
  try {
    // `no-store` so the dev check itself doesn't get a cached SW body.
    const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    if (!res.ok) return;
    body = await res.text();
  } catch {
    return;
  }
  const swHash = hashStr(body);
  let prev: StalenessRecord | null = null;
  try {
    const raw = localStorage.getItem(SW_STALENESS_STORAGE);
    if (raw) prev = JSON.parse(raw) as StalenessRecord;
  } catch {
    /* ignore */
  }
  if (prev && prev.url === url && prev.build !== currentBuild && prev.swHash === swHash) {
    // eslint-disable-next-line no-console
    console.warn(
      "[@etamong-playground/ui] registerServiceWorker: build SHA changed " +
        `(${prev.build.slice(0, 8)} → ${currentBuild.slice(0, 8)}) but ` +
        `${url} is byte-identical. Browsers won't roll over to the new ` +
        "SW — installed PWAs (esp. iOS) will keep serving the old shell. " +
        "Stamp the SW source with the build SHA (Vite: __BUILD_ID__ + define; " +
        "static sw.js: generate at build time). See " +
        "wiki/concepts/pwa-cache-and-ios-shell.",
    );
  }
  try {
    localStorage.setItem(
      SW_STALENESS_STORAGE,
      JSON.stringify({
        url,
        swHash,
        build: currentBuild,
        observedAt: Date.now(),
      } satisfies StalenessRecord),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Register a service worker with the etamong-lab update-flow conventions.
 * Returns a handle for programmatic control. Safe to call from `useEffect`
 * (no React dependency — works from any client-side bootstrap).
 */
export function registerServiceWorker(
  url: string,
  opts: RegisterServiceWorkerOptions = {},
): ServiceWorkerHandle {
  const {
    notifyOnUpdate = true,
    autoReloadOnUpdate = false,
    updateToastText = DEFAULT_TOAST_TEXT,
    updateIntervalMs = DEFAULT_INTERVAL_MS,
    registerOptions,
    onActivate,
    currentBuild,
  } = opts;

  let registration: ServiceWorkerRegistration | null = null;
  let hasUpdate = false;
  let intervalId: number | undefined;
  let reloading = false;

  const handle: ServiceWorkerHandle = {
    get registration() {
      return registration;
    },
    get hasUpdate() {
      return hasUpdate;
    },
    applyUpdate() {
      const waiting = registration?.waiting;
      if (waiting) waiting.postMessage({ type: "SKIP_WAITING" });
    },
    async checkForUpdate() {
      if (registration) await registration.update();
    },
    async unregister() {
      if (!registration) return false;
      const ok = await registration.unregister();
      registration = null;
      if (intervalId) window.clearInterval(intervalId);
      return ok;
    },
  };

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return handle;
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    onActivate?.();
    window.location.reload();
  });

  function watchWaiting(reg: ServiceWorkerRegistration) {
    const waiting = reg.waiting;
    if (!waiting || hasUpdate) return;
    hasUpdate = true;
    if (autoReloadOnUpdate) {
      waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    if (notifyOnUpdate) {
      // The toast text uses a callable hint — apps wanting a button
      // affordance should use the handle directly. We keep the toast
      // discoverable so users know to refresh.
      const id = toast(updateToastText, "info", 10000);
      void id;
    }
  }

  // Dev-only: detect the "SW byte-identical across deploys" failure
  // mode (the primary cause of iOS PWA staleness in the fleet).
  if (isDevBuild() && currentBuild) {
    void assertSwChangesAcrossBuilds(url, currentBuild);
  }

  // Start the registration. The SW load is deferred until window load to
  // avoid competing with critical resources.
  function start() {
    navigator.serviceWorker
      .register(url, registerOptions)
      .then((reg) => {
        registration = reg;
        watchWaiting(reg);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              watchWaiting(reg);
            }
          });
        });
        // Aggressive refresh: on load, on visibility flip, and on interval.
        void reg.update();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void reg.update();
        });
        if (updateIntervalMs > 0) {
          intervalId = window.setInterval(() => {
            void reg.update();
          }, updateIntervalMs);
        }
      })
      .catch(() => {
        // Registration failures are intentional silent — apps can still
        // function without the SW. Log via console if needed.
      });
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });

  return handle;
}

export interface NetworkFirstSwOptions {
  /**
   * Cache version suffix. Use a build SHA so caches roll over on every
   * deploy. Required.
   */
  version: string;
  /**
   * Network timeout (ms) before the SW falls back to the cached
   * navigation/asset. Default: 3000.
   */
  networkTimeoutMs?: number;
  /**
   * Extra URL prefixes the SW should leave alone (in addition to the
   * always-skipped `/api/`). Use for OIDC callbacks, webhook routes,
   * single-segment apiserver routes. Default: `[]`.
   *
   * Each entry is a prefix match against `url.pathname`.
   */
  passThroughPrefixes?: string[];
}

/**
 * Returns the canonical "online-first" SW source as a string. Write it to
 * `public/sw.js` at build time (most apps already have a build step that
 * inlines a `SW_VERSION` constant):
 *
 *   import { networkFirstSwSource } from "@etamong-playground/ui";
 *   await fs.writeFile(
 *     "public/sw.js",
 *     networkFirstSwSource({ version: process.env.BUILD_SHA }),
 *   );
 *
 * Or serve it dynamically from the app's own backend at `/sw.js`.
 *
 * The recipe:
 *   - Never intercepts non-GET or anything under `/api/` (or the
 *     `passThroughPrefixes`) — auth & live state always hit the network.
 *   - Navigation requests: network-first with `networkTimeoutMs`, cache
 *     fallback for offline. So a new deploy lands the moment the next
 *     navigation succeeds.
 *   - Static assets: network-first with the same timeout, cache fallback.
 *   - On `activate`, all caches not matching `version` are deleted.
 *   - `skipWaiting()` on install + `clients.claim()` on activate so the
 *     new SW takes over the next time the page navigates.
 */
export function networkFirstSwSource(opts: NetworkFirstSwOptions): string {
  const { version, networkTimeoutMs = 3000, passThroughPrefixes = [] } = opts;
  if (!version) throw new Error("networkFirstSwSource: version is required");
  const passList = JSON.stringify(["/api/", ...passThroughPrefixes]);
  const versionStr = JSON.stringify(version);
  const timeout = Number(networkTimeoutMs) || 3000;

  return `// Generated by @etamong-playground/ui networkFirstSwSource — see
// planning concepts/pwa-service-worker. Online-first; cache only as
// offline fallback. Edit the source, not this file.

const VERSION = ${versionStr};
const NAV_CACHE = "etu-nav-" + VERSION;
const ASSET_CACHE = "etu-asset-" + VERSION;
const PASS_THROUGH = ${passList};
const NET_TIMEOUT = ${timeout};

self.addEventListener("install", (event) => {
  // Take over on the next nav as soon as we're installed.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== NAV_CACHE && k !== ASSET_CACHE)
        .map((k) => caches.delete(k)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  // Triggered by registerServiceWorker.applyUpdate().
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function shouldPassThrough(url) {
  if (PASS_THROUGH.some((p) => url.pathname.startsWith(p))) return true;
  return false;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), NET_TIMEOUT);
  });
  try {
    const res = await Promise.race([fetch(req), timeoutPromise]);
    clearTimeout(timeoutId);
    if (res && res.ok && res.type !== "opaqueredirect") {
      cache.put(req, res.clone());
    }
    return res;
  } catch (_) {
    clearTimeout(timeoutId);
    const cached = await cache.match(req);
    if (cached) return cached;
    throw _;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (shouldPassThrough(url)) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, NAV_CACHE));
    return;
  }
  // Same-origin GET asset.
  event.respondWith(networkFirst(req, ASSET_CACHE));
});
`;
}
