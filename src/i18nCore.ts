/**
 * React-free i18n primitives — safe to import from `helpers.ts`, server
 * runtimes, or the index.html-adjacent script that emits the no-flash
 * snippet. The React provider/hooks live in `i18n.tsx` and re-export
 * everything from here.
 */

export type Locale = "ko" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["ko", "en"];

export type Messages = Record<string, string>;

export type MessageBundle = Record<Locale, Messages>;

export function storageKey(appKey: string): string {
  return `${appKey}-locale`;
}

export function detectSystemLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const candidates: string[] = [];
  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  } else if (typeof navigator.language === "string") {
    candidates.push(navigator.language);
  }
  for (const raw of candidates) {
    const tag = raw.toLowerCase();
    if (tag === "ko" || tag.startsWith("ko-")) return "ko";
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }
  return "en";
}

/** Read the active locale (saved choice → system → "en"). */
export function getLocale(appKey: string): Locale {
  try {
    const saved = localStorage.getItem(storageKey(appKey));
    if (saved === "ko" || saved === "en") return saved;
  } catch {
    /* storage unavailable */
  }
  return detectSystemLocale();
}

/** Persist and apply a locale to <html lang>. */
export function setLocale(appKey: string, locale: Locale): void {
  try {
    localStorage.setItem(storageKey(appKey), locale);
  } catch {
    /* storage unavailable */
  }
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", locale);
  }
}

/**
 * <head> snippet (no deps) that sets <html lang> from the saved choice,
 * falling back to system languages, then "en".
 */
export function noFlashLocaleScript(appKey: string): string {
  return `(function(){try{var k=${JSON.stringify(storageKey(appKey))};var s=localStorage.getItem(k);var l=s;if(l!=="ko"&&l!=="en"){l="en";var langs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""]);for(var i=0;i<langs.length;i++){var t=(langs[i]||"").toLowerCase();if(t==="ko"||t.indexOf("ko-")===0){l="ko";break;}if(t==="en"||t.indexOf("en-")===0){l="en";break;}}}document.documentElement.setAttribute("lang",l);}catch(e){}})();`;
}

/** Render `{name}` placeholders. Unknown placeholders pass through. */
export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => {
    const v = vars[k];
    return v === undefined || v === null ? m : String(v);
  });
}
