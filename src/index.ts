// React entry. For the framework-agnostic helpers (no React/cmdk), import from
// "@etamong-playground/ui/helpers". For the token + palette styles, import
// "@etamong-playground/ui/styles.css" once at the app root.
//
// The bundled `dist/index.{js,cjs}` is shipped with a `"use client";` banner
// (see tsup.config.ts) so Next.js RSC consumers can server-render a tree that
// imports anything from here without exploding on `createContext` — several
// sub-modules call it at module-init time and the RSC build of React doesn't
// expose it. The directive lives in the tsup banner, not in this source
// file, because esbuild strips bare source-level "use client" during bundling.
export { CommandPalette, type CommandPaletteProps } from "./CommandPalette";
export {
  CommandPaletteTrigger,
  type CommandPaletteTriggerProps,
} from "./trigger";
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
export {
  toast,
  dismissToast,
  Toaster,
  type ToastKind,
  type ToastItem,
} from "./toast";
export { uiConfirm, uiPrompt, DialogHost } from "./dialog";
export { DeployInfo, type DeployInfoProps } from "./deployInfo";
export { InstallBanner, useInstallPrompt, type InstallBannerProps } from "./installBanner";
export { StatusBanner, type StatusBannerProps } from "./statusBanner";
export {
  useStatusBanner,
  type StatusBannerData,
  type Severity as StatusBannerSeverity,
  type UseStatusBannerOptions,
} from "./useStatusBanner";
export { ErrorPage, type ErrorPageProps } from "./errorPage";
export {
  useRouteState,
  useSessionState,
  type UseRouteStateOptions,
  type UseSessionStateOptions,
} from "./useRouteState";
export {
  useInAppBack,
  runInAppBackFallback,
  type InAppBackFallback,
  type UseInAppBackOptions,
  type UseInAppBackResult,
} from "./useInAppBack";
export { BackButton, type BackButtonProps } from "./backButton";
export {
  createFetch,
  HttpError,
  type CreateFetchOptions,
  type FetchClient,
  type HttpErrorBody,
  type RequestOptions,
} from "./createFetch";
export {
  useMe,
  signInUrl,
  signOutUrl,
  signIn,
  signOut,
  type BaseMe,
  type UseMeOptions,
  type UseMeResult,
} from "./useMe";
export { EmptyState, type EmptyStateProps } from "./emptyState";
export {
  CopyButton,
  useClipboard,
  type CopyButtonProps,
  type UseClipboardOptions,
  type UseClipboardResult,
} from "./copyButton";
export {
  OpenInBrowserButton,
  type OpenInBrowserButtonProps,
} from "./openInBrowserButton";
export {
  registerServiceWorker,
  networkFirstSwSource,
  type RegisterServiceWorkerOptions,
  type ServiceWorkerHandle,
  type NetworkFirstSwOptions,
} from "./serviceWorker";
export {
  AdminGate,
  AdminBadge,
  BackofficeLayout,
  isAdminLike,
  type AdminCheckInput,
  type AdminGateProps,
  type AdminBadgeProps,
  type BackofficeLayoutProps,
} from "./backoffice";
export {
  AppInfoSection,
  type AppInfoSectionProps,
  type AppInfoLink,
} from "./appInfoSection";
export {
  formatRelTime,
  formatAbsTime,
  RelTime,
  type TimeLike,
  type FormatRelTimeOptions,
  type FormatAbsTimeOptions,
  type RelTimeProps,
} from "./time";
export {
  UserMenu,
  Avatar,
  type UserMenuProps,
  type UserMenuItem,
  type AvatarProps,
} from "./userMenu";
export {
  MobileTabBar,
  type MobileTabBarProps,
  type MobileTabBarItem,
} from "./mobileTabBar";
export {
  NotificationBell,
  type NotificationBellProps,
  type NotificationBellItem,
} from "./notificationBell";
export {
  Sidebar,
  SidebarToggle,
  useSidebarDrawer,
  type SidebarProps,
  type SidebarItem,
  type SidebarSecondarySection,
  type SidebarToggleProps,
} from "./sidebar";
export {
  I18nProvider,
  useI18n,
  useT,
  useLocale,
  getLocale,
  setLocale,
  noFlashLocaleScript,
  interpolate,
  SUPPORTED_LOCALES,
  type Locale,
  type Messages,
  type MessageBundle,
  type I18nProviderProps,
} from "./i18n";
export {
  ViewportProvider,
  useViewport,
  getViewport,
  noFlashViewportScript,
  TABLET_MIN,
  DESKTOP_MIN,
  type ViewportTier,
} from "./viewport";
export {
  NavigationBar,
  type NavigationBarProps,
} from "./navigationBar";
export { installIOSPwaShell } from "./installIOSPwaShell";
export {
  useLegalAvailability,
  LegalMenuItem,
  LegalPage,
  LegalRow,
  LEGAL_HUB_BASE_URL,
  LEGAL_MANIFEST_URL,
  type LegalAvailability,
  type LegalKind,
  type LegalMenuItemProps,
  type LegalPageProps,
  type LegalRowProps,
  type UseLegalAvailabilityOptions,
} from "./legalSection";
export {
  PolicyChangeBanner,
  type PolicyChangeBannerProps,
} from "./policyChangeBanner";
export {
  DataTable,
  type DataTableProps,
  type DataTableColumn,
} from "./dataTable";
// alpha — API may change before stable 0.20.0
export {
  DocsHub,
  buildSkillMarkdownText,
  type DocsHubProps,
  type DocsHubSection,
  type DocsHubSkill,
} from "./docsHub";
// Fleet-auth primitives — see planning/wiki/concepts/fleet-auth.md
// (planning#252). Implements the unified `/auth/{login,callback,logout}` +
// `/api/me` contract. Apps still on oauth2-proxy keep using the legacy
// `useMe`/`signInUrl`/`signOutUrl` exports above.
export {
  AuthGate,
  LoginButton,
  LogoutButton,
  SessionBadge,
  SessionExpiredDialog,
  useIdentity,
  fleetLoginUrl,
  fleetLogoutUrl,
  fleetSignIn,
  fleetSignOut,
  isShareCrawler,
  notifySessionExpired,
  refreshIdentity,
  SHARE_CRAWLER_UA_SUBSTRINGS,
  type AuthGateProps,
  type LoginButtonProps,
  type LogoutButtonProps,
  type SessionBadgeProps,
  type SessionExpiredDialogProps,
  type UseIdentityResult,
} from "./auth";
