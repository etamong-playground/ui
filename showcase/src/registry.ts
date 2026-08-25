export interface FeatureEntry {
  label: string;
  exports: readonly string[];
  since: string;
  src: string;
}

export const registry: Record<string, FeatureEntry> = {
  "command-palette": {
    label: "Command Palette",
    exports: ["CommandPalette", "CommandPaletteTrigger", "openCommandPalette"],
    since: "0.5.0",
    src: "src/CommandPalette.tsx",
  },
  "go-to-shortcuts": {
    label: "Go-To Keyboard Shortcuts",
    exports: ["useGoToShortcuts"],
    since: "0.5.0",
    src: "src/useGoToShortcuts.ts",
  },
  "cross-locale-keywords": {
    label: "Cross-Locale Palette Keywords",
    exports: ["crossLocaleKeywords"],
    since: "0.5.0",
    src: "src/keywords.ts",
  },
  "korean-search": {
    label: "Korean Choseong Palette Search",
    exports: ["koreanMatch"],
    since: "0.40.0",
    src: "src/keywords.ts",
  },
  "theme": {
    label: "Theme System",
    exports: ["getTheme", "setTheme"],
    since: "0.5.0",
    src: "src/theme.ts",
  },
  "toast": {
    label: "Toast Notifications",
    exports: ["Toaster", "toast"],
    since: "0.5.0",
    src: "src/toast.tsx",
  },
  "dialog": {
    label: "Modal Dialogs",
    exports: ["DialogHost", "uiConfirm", "uiPrompt"],
    since: "0.5.0",
    src: "src/dialog.tsx",
  },
  "deploy-info": {
    label: "Deploy Info Badge",
    exports: ["DeployInfo"],
    since: "0.5.0",
    src: "src/deployInfo.tsx",
  },
  "error-page": {
    label: "Error Page",
    exports: ["ErrorPage"],
    since: "0.6.0",
    src: "src/errorPage.tsx",
  },
  "route-state": {
    label: "URL Route State Hook",
    exports: ["useRouteState"],
    since: "0.7.0",
    src: "src/useRouteState.ts",
  },
  "session-state": {
    label: "Session Storage State Hook",
    exports: ["useSessionState"],
    since: "0.7.0",
    src: "src/useRouteState.ts",
  },
  "back-button": {
    label: "Back Button & In-App History",
    exports: ["BackButton", "useInAppBack"],
    since: "0.8.0",
    src: "src/backButton.tsx",
  },
  "empty-state": {
    label: "Empty State",
    exports: ["EmptyState"],
    since: "0.11.0",
    src: "src/emptyState.tsx",
  },
  "copy-button": {
    label: "Copy Button & Clipboard Hook",
    exports: ["CopyButton", "useClipboard"],
    since: "0.11.0",
    src: "src/copyButton.tsx",
  },
  "app-info-section": {
    label: "App Info Section Card",
    exports: ["AppInfoSection"],
    since: "0.14.0",
    src: "src/appInfoSection.tsx",
  },
  "page-composition": {
    label: "Page Composition & Settings",
    exports: ["PageContainer", "PageHeader", "SettingsGroup", "SettingsRow"],
    since: "0.49.0",
    src: "src/pageComposition.tsx",
  },
  "rel-time": {
    label: "Relative & Absolute Time",
    exports: ["RelTime", "formatRelTime", "formatAbsTime"],
    since: "0.15.0",
    src: "src/time.tsx",
  },
  "user-menu": {
    label: "User Menu & Avatar",
    exports: ["UserMenu", "Avatar"],
    since: "0.16.0",
    src: "src/userMenu.tsx",
  },
  "notification-bell": {
    label: "Notification Bell",
    exports: ["NotificationBell"],
    since: "0.32.0",
    src: "src/notificationBell.tsx",
  },
  "mobile-tab-bar": {
    label: "Mobile Tab Bar",
    exports: ["MobileTabBar"],
    since: "0.18.0",
    src: "src/mobileTabBar.tsx",
  },
  "sidebar": {
    label: "Sidebar Navigation Shell",
    exports: ["Sidebar"],
    since: "0.21.0",
    src: "src/sidebar.tsx",
  },
  "navigation-bar": {
    label: "Navigation Bar",
    exports: ["NavigationBar"],
    since: "0.23.0",
    src: "src/navigationBar.tsx",
  },
  "data-table": {
    label: "Data Table",
    exports: ["DataTable"],
    since: "0.24.0",
    src: "src/dataTable.tsx",
  },
  "i18n": {
    label: "i18n Provider (KO+EN)",
    exports: ["I18nProvider", "useT", "useLocale"],
    since: "0.28.0",
    src: "src/i18n.tsx",
  },
  "design-tokens": {
    label: "Design Tokens (v0.42 overhaul)",
    exports: [],
    since: "0.42.0",
    src: "src/styles.css",
  },
  "push-permission": {
    label: "Push Permission",
    exports: ["usePushPermission", "PushEnableRow"],
    since: "0.44.0",
    src: "src/pushPermission.ts",
  },
};

const GITHUB_BASE = "https://github.com/etamong-playground/ui";
const PKG = "@etamong-playground/ui";
// npmjs publishing started at this version
const NPM_FLOOR = "0.34.2";

// Tiny semver comparison — numeric triple only, no prerelease handling needed
function semverGte(a: string, b: string): boolean {
  const [a1 = 0, a2 = 0, a3 = 0] = a.split(".").map(Number);
  const [b1 = 0, b2 = 0, b3 = 0] = b.split(".").map(Number);
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 >= b3;
}

/** npmjs version page for v ≥ 0.34.2; GitHub releases tag page otherwise */
export function versionUrl(v: string): string {
  return semverGte(v, NPM_FLOOR)
    ? `https://www.npmjs.com/package/${PKG}/v/${v}`
    : `${GITHUB_BASE}/releases/tag/v${v}`;
}

/** GitHub source link for a feature entry */
export function srcUrl(entry: FeatureEntry): string {
  return `${GITHUB_BASE}/blob/main/${entry.src}`;
}

/** Feature id → showcase hash route for the demo jump button */
export const featureRoute: Record<string, string> = {
  "command-palette": "#/palette",
  "go-to-shortcuts": "#/palette",
  "cross-locale-keywords": "#/palette",
  "korean-search": "#/palette",
  "theme": "#/chrome",
  "toast": "#/notifications",
  "dialog": "#/notifications",
  "deploy-info": "#/appinfo",
  "error-page": "#/error",
  "route-state": "#/state",
  "session-state": "#/state",
  "back-button": "#/chrome",
  "empty-state": "#/chrome",
  "copy-button": "#/data",
  "app-info-section": "#/appinfo",
  "page-composition": "#/composition",
  "rel-time": "#/data",
  "user-menu": "#/chrome",
  "notification-bell": "#/chrome",
  "mobile-tab-bar": "#/chrome",
  "sidebar": "#/chrome",
  "navigation-bar": "#/chrome",
  "data-table": "#/data",
  "i18n": "#/chrome",
  "design-tokens": "#/tokens",
  "push-permission": "#/notifications",
};
