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
