// In-app-browser breakout for the shared Google login.
//
// Google returns 403 disallowed_useragent for OAuth attempted inside an
// embedded WebView (KakaoTalk / Instagram / Facebook / LINE / Naver in-app
// browsers). The only fix is getting the user into the system browser
// (Chrome/Safari) — where Google OAuth is allowed — before the OAuth flow
// starts. `fleetSignIn()` calls `inAppBreakout()` on the `/auth/login` URL so
// the whole flow runs in one browser.
//
// This is the app-layer twin of the service-edge Worker interstitial
// (planning wiki: concepts/in-app-browser-breakout). The Worker is the
// fleet-wide backstop; this fires the scheme redirect one hop earlier, at the
// sign-in click, and covers apps that reach it before any navigation.

// UA substrings (lowercased) that identify embedded WebViews Google blocks.
// Deliberately a whitelist of known-bad in-app browsers, NOT a catch-all `wv`:
// Chrome Custom Tabs and SFSafariViewController are legitimate OAuth surfaces
// Google does NOT block, so bouncing them would regress a working login.
export const INAPP_BROWSER_UA_SUBSTRINGS = [
  "kakaotalk",
  "instagram",
  "fban", // Facebook app (iOS)
  "fbav", // Facebook app
  "fb_iab", // Facebook in-app browser (Android)
  " line/", // leading space: real LINE UAs read "... Safari/537.36 Line/13.x"; avoids "streamline/"
  "naver(inapp",
  "daumapps",
  "kakaostory",
  "band/",
  "everytimeapp",
] as const;

function currentUa(ua?: string): string {
  if (ua != null) return ua;
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

/** True when the (current or given) UA is an embedded WebView Google blocks. */
export function isInAppBrowser(ua?: string): boolean {
  const s = currentUa(ua).toLowerCase();
  if (!s) return false;
  return INAPP_BROWSER_UA_SUBSTRINGS.some((needle) => s.includes(needle));
}

export type InAppBreakoutResult =
  | "redirected" // fired a scheme redirect into the system browser
  | "no-scheme" // in-app browser with no breakout scheme (caller/edge shows a guide)
  | "not-in-app"; // normal browser — no action

/**
 * If running inside a known in-app browser, attempt to reopen `url` (default:
 * the current location) in the system browser and return `"redirected"`.
 * KakaoTalk and LINE expose external-browser schemes; Android WebViews fall
 * back to a Chrome `intent://`. In-app browsers with no scheme (iOS
 * Instagram/Facebook/Naver) return `"no-scheme"` — the caller should let the
 * navigation proceed so the service-edge `/auth/login` interstitial can show
 * its open-in-browser guide. SSR-safe: returns `"not-in-app"` when there is no
 * `window`.
 */
export function inAppBreakout(url?: string): InAppBreakoutResult {
  if (typeof window === "undefined") return "not-in-app";
  const ua = navigator.userAgent;
  if (!isInAppBrowser(ua)) return "not-in-app";

  // Resolve to an absolute URL — the system browser must receive a full URL,
  // and a caller may pass a relative `/auth/login?rd=…`. Only reached for a
  // real in-app UA, so `window.location` is a genuine Location here.
  const target = new URL(url ?? window.location.href, window.location.href).href;
  const l = ua.toLowerCase();

  if (l.includes("kakaotalk")) {
    window.location.href =
      "kakaotalk://web/openExternal?url=" + encodeURIComponent(target);
    return "redirected";
  }
  if (l.includes(" line/")) {
    window.location.href =
      target + (target.includes("?") ? "&" : "?") + "openExternalBrowser=1";
    return "redirected";
  }
  if (/android/i.test(ua)) {
    window.location.href =
      "intent://" +
      target.replace(/^https?:\/\//, "") +
      "#Intent;scheme=https;package=com.android.chrome;end";
    return "redirected";
  }
  return "no-scheme";
}
