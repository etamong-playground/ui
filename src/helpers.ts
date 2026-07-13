// Framework-agnostic entry: no React, no cmdk. Safe to import from a server
// runtime or an app's index.html-adjacent script.
export {
  crossLocaleKeywords,
  isInputTarget,
  shortcutKey,
  CODE_TO_KEY,
  COMMAND_PALETTE_OPEN_EVENT,
  openCommandPalette,
} from "./keywords";
export {
  noFlashThemeScript,
  getTheme,
  setTheme,
  type Theme,
} from "./theme";
export {
  noFlashLocaleScript,
  getLocale,
  setLocale,
  interpolate,
  SUPPORTED_LOCALES,
  type Locale,
  type Messages,
  type MessageBundle,
} from "./i18nCore";
export {
  noFlashViewportScript,
  getViewport,
  TABLET_MIN,
  DESKTOP_MIN,
  type ViewportTier,
} from "./viewportCore";
export {
  inAppBreakout,
  isInAppBrowser,
  INAPP_BROWSER_UA_SUBSTRINGS,
  type InAppBreakoutResult,
} from "./inAppBreakout";
