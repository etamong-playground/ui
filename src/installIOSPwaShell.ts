/**
 * Tag the document with PWA / iOS-PWA classes and harden the iOS standalone
 * shell against the two recurring complaints:
 *
 *   - Korean body text "shrinks" when the app is launched from the home screen
 *     because iOS's text-size-adjust kicks in without the Safari toolbar. The
 *     `@etamong-playground/ui/styles.css` reset locks this declaratively; this helper
 *     re-applies the lock via an explicit inline style, defensively, for hosts
 *     that mount their own stylesheet after ours.
 *   - Tapping a `<input>` whose font-size is below 16px triggers a zoom that
 *     never zooms back out. Opt-in: set `<html data-etu-lock-zoom>` and we set
 *     `maximum-scale=1` on the viewport meta in iOS PWA mode.
 *
 * Call once from app bootstrap (before or after first paint, both fine — it's
 * idempotent). No React; safe from any client-side entry.
 */

const PWA_CLASS = "etu-pwa-standalone";
const IOS_PWA_CLASS = "etu-ios-pwa";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS reports as Mac; the touchpoint check disambiguates.
  return ua.includes("Mac") && typeof document !== "undefined" &&
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  try {
    return window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

export function installIOSPwaShell(): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (!html) return;

  const standalone = isStandalone();
  const ios = isIOS();

  if (standalone) html.classList.add(PWA_CLASS);
  if (standalone && ios) html.classList.add(IOS_PWA_CLASS);

  // Defensive: explicit inline lock for the text-size-adjust property. The
  // CSS reset already does this, but a late-mounted stylesheet from the app
  // can clobber it; an inline style on the root element wins.
  if (standalone && ios) {
    html.style.setProperty("-webkit-text-size-adjust", "100%");
    html.style.setProperty("text-size-adjust", "100%");
  }

  // Opt-in zoom lock on the viewport meta (iOS PWA only). Apps that want to
  // suppress the input-focus zoom can set `<html data-etu-lock-zoom>` in
  // their entry HTML. We keep this opt-in because `maximum-scale=1` also
  // blocks the user's accessibility zoom — not always the right trade-off.
  if (standalone && ios && html.hasAttribute("data-etu-lock-zoom")) {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (meta) {
      const content = meta.getAttribute("content") || "";
      if (!/maximum-scale/.test(content)) {
        meta.setAttribute("content", content.replace(/\s*$/, "") + ", maximum-scale=1");
      }
    }
  }
}
