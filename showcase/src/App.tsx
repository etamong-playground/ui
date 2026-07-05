import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CommandPalette,
  CommandPaletteTrigger,
  DialogHost,
  MobileTabBar,
  NavigationBar,
  Sidebar,
  Toaster,
  crossLocaleKeywords,
  getTheme,
  setTheme,
  useGoToShortcuts,
  useLocale,
  useT,
  type CommandSection,
  type MobileTabBarItem,
  type SidebarItem,
} from "@etamong-playground/ui";
import { messages } from "./messages";
import { Overview } from "./sections/Overview";
import { PaletteSection } from "./sections/PaletteSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { ChromeSection } from "./sections/ChromeSection";
import { DataTimeSection } from "./sections/DataTimeSection";
import { StateHooksSection } from "./sections/StateHooksSection";
import { ErrorPageSection } from "./sections/ErrorPageSection";
import { AppInfoSection } from "./sections/AppInfoSection";
import { VersionsSection } from "./sections/VersionsSection";

// Sections ordered — drives sidebar, mobile tab bar, and command palette
const SECTION_IDS = [
  "overview",
  "palette",
  "notifications",
  "chrome",
  "data",
  "state",
  "error",
  "appinfo",
  "versions",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

function hashToSection(hash: string): SectionId {
  const path = hash.startsWith("#/") ? hash.slice(2) : hash.startsWith("/") ? hash.slice(1) : hash;
  if ((SECTION_IDS as readonly string[]).includes(path)) return path as SectionId;
  return "overview";
}

function useHash(): [string, (path: string) => void] {
  const [hash, setHash] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.hash : "#/overview",
  );

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  return [hash, navigate];
}

// Section SVG icons (inline, no icon library dep)
function IconOverview() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function IconPalette() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconTable() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  );
}
function IconDatabase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}
function IconMore() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}
function IconVersions() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function ThemeToggleButton() {
  const [theme, setThemeState] = useState<"light" | "dark">(() => getTheme("ui-showcase"));

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme("ui-showcase", next);
    setThemeState(next);
  };

  return (
    <button type="button" className="sc-icon-btn" onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode" : "Dark mode"}>
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function LocaleToggleButton() {
  const [locale, setLocale] = useLocale();
  return (
    <button
      type="button"
      className="sc-icon-btn sc-locale-btn"
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      title={locale === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      {locale === "ko" ? "EN" : "KO"}
    </button>
  );
}

export function App() {
  const t = useT();
  const [hash, navigate] = useHash();
  const section = hashToSection(hash);

  const go = useCallback((id: SectionId) => navigate(`#/${id}`), [navigate]);

  const goToRoutes = useMemo(
    () => [
      { key: "o", href: "#/overview" },
      { key: "p", href: "#/palette" },
      { key: "n", href: "#/notifications" },
      { key: "c", href: "#/chrome" },
      { key: "d", href: "#/data" },
      { key: "s", href: "#/state" },
      { key: "e", href: "#/error" },
      { key: "a", href: "#/appinfo" },
      { key: "v", href: "#/versions" },
    ],
    [],
  );

  const pending = useGoToShortcuts(goToRoutes, navigate);

  const dicts = [messages.ko, messages.en];

  const navSections: CommandSection[] = useMemo(
    () => [
      {
        id: "pages",
        heading: t("palette.pages"),
        items: SECTION_IDS.map((id) => ({
          id: `nav-${id}`,
          label: t(`nav.${id}`),
          keywords: crossLocaleKeywords(dicts, () => t(`nav.${id}`)),
          onSelect: () => go(id),
        })),
      },
      {
        id: "actions",
        heading: t("palette.actions"),
        items: [
          {
            id: "theme-dark",
            label: t("theme.dark"),
            keywords: crossLocaleKeywords(dicts, () => t("theme.dark")),
            onSelect: () => { setTheme("ui-showcase", "dark"); },
          },
          {
            id: "theme-light",
            label: t("theme.light"),
            keywords: crossLocaleKeywords(dicts, () => t("theme.light")),
            onSelect: () => { setTheme("ui-showcase", "light"); },
          },
          {
            id: "locale-ko",
            label: t("locale.ko"),
            onSelect: () => { /* setLocale available via hook in context */ },
          },
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, go],
  );

  const icons: Record<SectionId, typeof IconOverview> = {
    overview: IconOverview,
    palette: IconPalette,
    notifications: IconBell,
    chrome: IconLayers,
    data: IconTable,
    state: IconDatabase,
    error: IconAlert,
    appinfo: IconInfo,
    versions: IconVersions,
  };

  const primary: SidebarItem[] = useMemo(
    () =>
      ["overview", "palette", "notifications", "chrome", "data"].map((id) => {
        const Icon = icons[id as SectionId];
        return {
          id,
          label: t(`nav.${id}`),
          icon: <Icon />,
          active: section === id,
          onClick: () => go(id as SectionId),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section, t, go],
  );

  const secondary: SidebarItem[] = useMemo(
    () =>
      ["state", "error", "appinfo", "versions"].map((id) => {
        const Icon = icons[id as SectionId];
        return {
          id,
          label: t(`nav.${id}`),
          icon: <Icon />,
          active: section === id,
          onClick: () => go(id as SectionId),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section, t, go],
  );

  const mobileItems = useMemo<MobileTabBarItem[]>(() => {
    const primaryMobile: MobileTabBarItem[] = (
      ["overview", "palette", "notifications", "chrome"] as const
    ).map((id) => {
      const Icon = icons[id];
      return {
        id,
        label: t(`nav.${id}`),
        icon: <Icon />,
        active: section === id,
        onClick: () => go(id),
      };
    });
    const moreItem: MobileTabBarItem = {
      id: "more",
      label: t("nav.more"),
      icon: <IconMore />,
      active: (["state", "error", "appinfo", "versions"] as readonly string[]).includes(section),
      onClick: () => go("state"),
    };
    return [...primaryMobile, moreItem];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, t, go]);

  const sectionTitle = t(`section.${section}`);

  const sidebarFooter = (
    <div className="sc-sidebar-footer">
      <ThemeToggleButton />
      <LocaleToggleButton />
      <CommandPaletteTrigger label={t("palette.search")} />
    </div>
  );

  return (
    <>
      <Toaster />
      <DialogHost />
      <CommandPalette
        sections={navSections}
        onNavigate={navigate}
        labels={{
          placeholder: t("palette.placeholder"),
          noResults: t("palette.noResults"),
          searchHeading: t("palette.searchLabel"),
        }}
      />
      <div className="etu-app-shell sc-shell">
        <Sidebar
          appName={t("sidebar.appName")}
          primary={primary}
          secondary={secondary}
          secondaryCaption={t("sidebar.more")}
          footer={sidebarFooter}
          tabletMode="rail"
        />
        <div className="sc-main-area">
          <NavigationBar
            title={sectionTitle}
            trailing={
              <div className="sc-nav-trailing">
                <ThemeToggleButton />
                <LocaleToggleButton />
              </div>
            }
          />
          <main className="sc-content">
            {pending && (
              <div className="sc-shortcut-hint" aria-live="polite">
                g + …
              </div>
            )}
            {section === "overview" && <Overview navigate={navigate} />}
            {section === "palette" && <PaletteSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "chrome" && <ChromeSection navigate={navigate} />}
            {section === "data" && <DataTimeSection />}
            {section === "state" && <StateHooksSection />}
            {section === "error" && <ErrorPageSection />}
            {section === "appinfo" && <AppInfoSection />}
            {section === "versions" && <VersionsSection navigate={navigate} />}
          </main>
        </div>
        <MobileTabBar items={mobileItems} ariaLabel={t("nav.more")} />
      </div>
    </>
  );
}
