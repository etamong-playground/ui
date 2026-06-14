/**
 * Fleet i18n primitive — KO + EN with system-language detection.
 *
 * Contract (see planning/wiki/concepts/i18n-ko-en.md):
 *
 *   - Two locales: "ko" and "en". No others — apps that need more locales
 *     extend this module rather than reinventing it.
 *   - System default: first KO/EN match in `navigator.languages`; otherwise
 *     "en" (the fleet-wide fallback — the audience-of-record assumption when
 *     we can't tell).
 *   - User override: persisted in `localStorage` under `<appKey>-locale`.
 *   - <html lang> stays in sync.
 *   - No flash: inject `noFlashLocaleScript(appKey)` in <head> so the
 *     lang attribute is set before first paint.
 *
 * Message shape: flat `Record<key, string>` per locale. Tiny `{name}`
 * interpolation only — no plural/select. Apps that need ICU graduate to
 * a real lib; the surface area this primitive covers is nav strings +
 * confirmation prompts, where flat strings are sufficient.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  detectSystemLocale,
  getLocale,
  interpolate,
  setLocale,
  storageKey,
  type Locale,
  type MessageBundle,
} from "./i18nCore";

export {
  detectSystemLocale,
  getLocale,
  interpolate,
  noFlashLocaleScript,
  setLocale,
  SUPPORTED_LOCALES,
  type Locale,
  type MessageBundle,
  type Messages,
} from "./i18nCore";

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  /** Per-app namespace key — same one you pass to `<ThemeProvider>`. */
  appKey: string;
  /** Localized messages keyed by locale. EN entries act as the fallback. */
  messages: MessageBundle;
  children: ReactNode;
}

export function I18nProvider({ appKey, messages, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale(appKey));

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  useEffect(() => {
    // Track OS language change while no user override is set.
    if (typeof window === "undefined") return;
    function onChange() {
      try {
        const saved = localStorage.getItem(storageKey(appKey));
        if (saved === "ko" || saved === "en") return;
      } catch {
        return;
      }
      setLocaleState(detectSystemLocale());
    }
    window.addEventListener("languagechange", onChange);
    return () => window.removeEventListener("languagechange", onChange);
  }, [appKey]);

  const setLocaleCb = useCallback(
    (next: Locale) => {
      setLocale(appKey, next);
      setLocaleState(next);
    },
    [appKey],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const localized = messages[locale]?.[key];
      const fallback = messages.en?.[key];
      const raw = localized ?? fallback ?? key;
      return interpolate(raw, vars);
    },
    [messages, locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale: setLocaleCb, t }),
    [locale, setLocaleCb, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Returns the active `t(key, vars?)` translator + current locale + setter. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error(
      "[@etamong-lab/ui] useI18n / useT must be used inside <I18nProvider>",
    );
  }
  return ctx;
}

/** Convenience: just the translator. Equivalent to `useI18n().t`. */
export function useT(): I18nContextValue["t"] {
  return useI18n().t;
}

/** Convenience: just `[locale, setLocale]`. */
export function useLocale(): [Locale, (next: Locale) => void] {
  const { locale, setLocale } = useI18n();
  return [locale, setLocale];
}
