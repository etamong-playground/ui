/**
 * PWA install affordance — a small dismissable mobile banner that shows the
 * right thing per platform:
 *
 *  - Chrome / Android: captures `beforeinstallprompt`, shows an "Install"
 *    button that fires the native prompt.
 *  - iOS Safari: no programmatic install — show a short "Share → Add to Home
 *    Screen" hint instead.
 *  - Anywhere already installed (`display-mode: standalone`): renders nothing.
 *
 * The banner is mobile-only by default (hides on `min-width: 768px`); for a
 * desktop affordance, ship a small inline button or call `useInstallPrompt`
 * yourself.
 *
 * Per-app: drop `<InstallBanner />` once near the root (same boundary as
 * `<Toaster />`). Renders nothing in unsupported environments, so it's safe to
 * mount unconditionally.
 */

import { useEffect, useRef, useState } from "react";

const DEFAULTS = {
  label: "홈 화면에 추가하면 더 빠르게!",
  iosHint: "공유 → \"홈 화면에 추가\"로 설치하세요",
  installLabel: "설치",
  dismissLabel: "닫기",
  cooldownMs: 3 * 24 * 60 * 60 * 1000, // 3 days
  maxDismiss: 3,
  storageKey: "etu-install-banner",
};

export interface InstallBannerProps {
  /** Banner body text on supported (Chrome/Android) platforms. */
  label?: string;
  /** Banner body text on iOS Safari (where no programmatic prompt is possible). */
  iosHint?: string;
  /** Install button label (Chrome/Android only). */
  installLabel?: string;
  /** Aria-label for the close button. */
  dismissLabel?: string;
  /** Custom icon node rendered at the start of the banner. */
  icon?: React.ReactNode;
  /** Cooldown between re-shows after a dismiss, in ms. Default 3 days. */
  cooldownMs?: number;
  /** Stop offering after this many dismisses. Default 3. */
  maxDismiss?: number;
  /** localStorage key for persistence. Pick a per-app value to avoid clashes. */
  storageKey?: string;
  /** Extra class merged with `etu-install-banner`. */
  className?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface State {
  count: number;
  last: number;
}

function readState(key: string): State {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { count: 0, last: 0 };
    const p = JSON.parse(raw);
    if (Number.isFinite(p.count) && Number.isFinite(p.last)) return p;
  } catch {
    // ignore
  }
  return { count: 0, last: 0 };
}

function saveState(key: string, s: State) {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    // iOS Safari standalone flag (lowercase property on navigator)
    return "standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  } catch {
    return false;
  }
}

/**
 * Lower-level hook for apps that want to render their own UI.
 *
 *  - `canPrompt` — Chrome/Android has fired `beforeinstallprompt`; call `promptInstall()` to show it.
 *  - `isIOS` — render iOS guidance text.
 *  - `isStandalone` — the app is already installed; render nothing.
 */
export function useInstallPrompt() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [iosFlag, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const evtRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIos(isIOS());
    setStandalone(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      evtRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      evtRef.current = null;
      setCanPrompt(false);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall(): Promise<"accepted" | "dismissed" | "unsupported"> {
    const evt = evtRef.current;
    if (!evt) return "unsupported";
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    evtRef.current = null;
    setCanPrompt(false);
    return outcome;
  }

  return { canPrompt, promptInstall, isIOS: iosFlag, isStandalone: standalone };
}

/** Default download-arrow icon. Apps can pass their own via `icon`. */
function DefaultIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
    </svg>
  );
}

export function InstallBanner({
  label = DEFAULTS.label,
  iosHint = DEFAULTS.iosHint,
  installLabel = DEFAULTS.installLabel,
  dismissLabel = DEFAULTS.dismissLabel,
  icon,
  cooldownMs = DEFAULTS.cooldownMs,
  maxDismiss = DEFAULTS.maxDismiss,
  storageKey = DEFAULTS.storageKey,
  className,
}: InstallBannerProps) {
  const { canPrompt, promptInstall, isIOS: iosFlag, isStandalone: standalone } = useInstallPrompt();
  const [allowed, setAllowed] = useState(false);
  const [closed, setClosed] = useState(false);

  // Honor cooldown + max-dismiss from previous sessions. Runs once; if the
  // cooldown hasn't elapsed, schedule a timer to flip `allowed` later.
  useEffect(() => {
    if (standalone) return;
    const { count, last } = readState(storageKey);
    if (count >= maxDismiss) return;
    const remaining = Math.max(0, last + cooldownMs - Date.now());
    const t = setTimeout(() => setAllowed(true), remaining);
    return () => clearTimeout(t);
  }, [standalone, storageKey, cooldownMs, maxDismiss]);

  if (closed || standalone || !allowed) return null;
  // Show iOS guidance OR a real install button — but not nothing.
  if (!iosFlag && !canPrompt) return null;

  function dismiss() {
    const prev = readState(storageKey);
    saveState(storageKey, { count: prev.count + 1, last: Date.now() });
    setClosed(true);
  }

  async function install() {
    const outcome = await promptInstall();
    if (outcome !== "unsupported") setClosed(true);
  }

  return (
    <div className={"etu-install-banner" + (className ? " " + className : "")}>
      <div className="etu-install-banner-icon">{icon ?? <DefaultIcon />}</div>
      <p className="etu-install-banner-body">{iosFlag ? iosHint : label}</p>
      {!iosFlag && (
        <button type="button" className="etu-install-banner-cta" onClick={install}>
          {installLabel}
        </button>
      )}
      <button
        type="button"
        className="etu-install-banner-close"
        onClick={dismiss}
        aria-label={dismissLabel}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
