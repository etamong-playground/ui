// React entry. For the framework-agnostic helpers (no React/cmdk), import from
// "@etamong-lab/ui/helpers". For the token + palette styles, import
// "@etamong-lab/ui/styles.css" once at the app root.
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
  Sidebar,
  type SidebarProps,
  type SidebarItem,
  type SidebarSecondarySection,
} from "./sidebar";
export {
  NavigationBar,
  type NavigationBarProps,
} from "./navigationBar";
export { installIOSPwaShell } from "./installIOSPwaShell";
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
