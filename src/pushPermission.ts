/**
 * `usePushPermission()` — the state machine behind the fleet's Web Push
 * permission affordance (planning#1140). The package owns permission +
 * affordance only; the actual subscribe POST stays app-side (each app has
 * its own `/api/push/...` endpoints) — call `prompt()`, then on a
 * `"granted"` result do `registration.pushManager.subscribe(...)` +
 * your own upload.
 *
 * States:
 *  - `"unsupported"` — no `Notification` / `PushManager` / service-worker
 *    (older WebViews, kiosk browsers). Render nothing, never a dead button.
 *  - `"needs-install"` — iOS Safari only allows web push once the PWA is
 *    installed to the Home Screen. Detected via the exact same detectors
 *    `useInstallPrompt` uses internally (`detectIOS`/`detectStandalone`,
 *    exported from `installBanner.tsx` for this purpose), so the two can't
 *    drift apart — this hook calls them directly rather than trusting
 *    `useInstallPrompt`'s own derived state, which settles one render later.
 *  - `"default"` — permission not yet decided; `prompt()` will show the
 *    native dialog.
 *  - `"granted"` / `"denied"` — mirrors `Notification.permission`. Browsers
 *    never re-prompt after a `"denied"`, so `prompt()` is a no-op once
 *    denied — the caller must send the user to browser/site settings.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { detectIOS, detectStandalone, useInstallPrompt } from "./installBanner";

export type PushPermissionState =
  | "unsupported"
  | "needs-install"
  | "default"
  | "granted"
  | "denied";

export interface UsePushPermissionResult {
  state: PushPermissionState;
  /** `false` only for `"unsupported"` — true for every other state, including `"needs-install"`. */
  supported: boolean;
  /** `state === "default"` — safe to show an enable button. */
  canPrompt: boolean;
  /** `state === "denied"` — never call `prompt()` again; explain re-enabling instead. */
  isBlocked: boolean;
  /** `state === "needs-install"` — show the install-to-Home-Screen path, not a permission button. */
  needsInstall: boolean;
  /**
   * Requests permission. Must be called from a user gesture (click handler)
   * — the resulting promise chain still works because the browser call
   * itself happens synchronously inside the handler. No-ops (returns the
   * current state without calling the native API) unless `state ===
   * "default"`, so a stray call after a denial can never re-trigger a
   * prompt the platform would refuse anyway.
   */
  prompt: () => Promise<PushPermissionState>;
}

function detectSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return "Notification" in window && "PushManager" in window && "serviceWorker" in navigator;
  } catch {
    return false;
  }
}

export function usePushPermission(): UsePushPermissionResult {
  // Kept mounted purely so this effect re-runs if iOS/standalone status
  // changes later in the session (e.g. an `appinstalled` event flips
  // standalone mid-session) — the *values* themselves are re-derived fresh
  // below via `detectIOS()`/`detectStandalone()` rather than trusted
  // directly. `useInstallPrompt`'s own `isIOS`/`isStandalone` start at
  // `false` and only resolve inside its own `useEffect`, which on first
  // mount commits one render *after* this hook's effect already ran with
  // the stale `false` closure — trusting it directly would flash
  // `"default"` for an iOS/non-standalone user for one paint before
  // self-correcting to `"needs-install"`. Calling the raw detectors here
  // settles correctly in a single pass.
  const { isIOS, isStandalone } = useInstallPrompt();
  // SSR-safe: starts at "unsupported" (matches the server render) and
  // resolves to the real state after mount, same pattern as
  // `useInstallPrompt`'s `canPrompt`/`isStandalone` below it.
  const [state, setState] = useState<PushPermissionState>("unsupported");

  useEffect(() => {
    if (!detectSupport()) {
      setState("unsupported");
      return;
    }
    if (detectIOS() && !detectStandalone()) {
      setState("needs-install");
      return;
    }
    setState(Notification.permission);
  }, [isIOS, isStandalone]);

  // Guards against a second `prompt()` firing while the first is still
  // pending — both would otherwise pass the `!== "default"` check below and
  // hit the native API concurrently. A second concurrent caller gets back
  // the same in-flight promise instead. (`setState` after unmount is a
  // harmless no-op as of React 18 — no unmount guard needed here.)
  const inFlightRef = useRef<Promise<PushPermissionState> | null>(null);
  const prompt = useCallback(async (): Promise<PushPermissionState> => {
    if (inFlightRef.current) return inFlightRef.current;
    if (!detectSupport()) return "unsupported";
    if (detectIOS() && !detectStandalone()) return "needs-install";
    if (Notification.permission !== "default") return Notification.permission;
    const run = (async () => {
      const result = await Notification.requestPermission();
      setState(result);
      return result;
    })();
    inFlightRef.current = run;
    try {
      return await run;
    } finally {
      inFlightRef.current = null;
    }
  }, []);

  return {
    state,
    supported: state !== "unsupported",
    canPrompt: state === "default",
    isBlocked: state === "denied",
    needsInstall: state === "needs-install",
    prompt,
  };
}
