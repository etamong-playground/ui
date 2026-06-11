// React entry. For the framework-agnostic helpers (no React/cmdk), import from
// "@etamong-lab/ui/helpers". For the token + palette styles, import
// "@etamong-lab/ui/styles.css" once at the app root.
export { CommandPalette, type CommandPaletteProps } from "./CommandPalette";
export {
  useGoToShortcuts,
  type GoToRoute,
  type GoToOptions,
} from "./useGoToShortcuts";
export type {
  CommandItem,
  CommandSection,
  CommandSearchAction,
  CommandPaletteLabels,
} from "./types";
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
