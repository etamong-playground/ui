# Changelog

## 0.28.1

`<NavigationBar>` hardening + a proactive dev-mode layout assertion so
the kind of layout bug the user just hit (iOS PWA: title row partially
below the visible viewport on iPhone notched devices, title font
shrinking in standalone) is caught the next time it slips in, not after
a user report.

- `<NavigationBar safeAreaTop>` — new prop, default `true`. When `false`,
  the sticky bar omits `padding-top: env(safe-area-inset-top)`. For apps
  that already have a global top-chrome bar above their per-page nav
  (festplan/xatu pattern). Avoids the double safe-area stack that pushed
  page titles ~60px below the visible viewport on notched iOS PWAs.
- `.etu-navbar-title` font-size is now hard-coded `17px` (the HIG
  navigation-title default) instead of `1rem`. Insulates the title from
  any host that sets `html { font-size: < 16px }` — root-relative sizing
  was inheriting the shrink. iOS PWA title shrink reports closed.
- **Dev-only runtime assertion**: on mount + on viewport resize the bar
  measures its bounding rect, computed font-size, and ancestor chain. It
  emits a `console.warn` (one per condition per instance) when:
  - the bar's bottom edge is below the visible viewport
  - the bar is partially clipped at the bottom edge
  - the title computed font-size is below the 16px floor
  - a sticky/fixed ancestor with `padding-top ≥ 20px` (i.e. already
    eating `env(safe-area-inset-top)`) sits above this bar
  The check is dead-code in production builds via a `process.env.NODE_ENV
  === "production"` short-circuit.
- **CI gate** — new optional subpath export `@etamong-lab/ui/testing`
  ships Playwright helpers (`assertViewportFit`,
  `defineViewportFitTests`, `FLEET_VIEWPORT_PROFILES`) that lift the
  dev-mode warnings into a test failure. Companion
  `ci/viewport-fit.gitlab-ci.yml` snippet for `include:` in any app
  pipeline. `@playwright/test` is an optional peer — apps without e2e
  are unaffected. See planning
  `wiki/concepts/viewport-fit-assertions.md`.

## 0.28.0

Fleet-wide responsive + i18n + theme-fallback bundle. Three orthogonal
primitives landing in one release so apps can adopt them in one MR.

### i18n (KO + EN, system default, EN fallback)

- `<I18nProvider appKey messages>` + `useT()` + `useLocale()`. Two
  locales — `"ko"` and `"en"`. Resolution: saved user choice →
  `navigator.languages` first KO/EN match → `"en"`.
- `noFlashLocaleScript(appKey)` — synchronous `<head>` snippet that sets
  `<html lang>` before first paint.
- Tiny `{name}` interpolation only; apps needing plural/select graduate
  to a real lib (this primitive's surface area is nav strings + prompts).
- React-free entry: `getLocale`, `setLocale`, `interpolate`,
  `noFlashLocaleScript` are exported from `@etamong-lab/ui/helpers` too.

### 3-tier responsive layout

- `noFlashViewportScript` + `<ViewportProvider>` + `useViewport()`.
  Tiers: `"mobile"` < 720, `"tablet"` 720–1023, `"desktop"` ≥ 1024.
- `<Sidebar tabletMode>` — controls behavior at the tablet tier:
  - `"rail"` (default) — icon-only 64px column. Fixes the iPad Mini
    portrait (768px) case where a full 240px sidebar squeezed content
    into an empty column.
  - `"drawer"` — hidden until `open`; consumer mounts `<SidebarToggle>`.
    Auto-closes on Escape and (with `useSidebarDrawer(appKey, routeKey)`)
    on route change. Scrim + slide-in.
  - `"full"` — v0.27 behavior, 240px at all ≥720px widths. Use only when
    tablet sizes are rare.
- Default is `"rail"`, not `"full"` — this is a visible change to apps
  that mount `<Sidebar>` without specifying `tabletMode`. To preserve
  the v0.27 look, pass `tabletMode="full"`.

### Theme — fallback dark

- `noFlashThemeScript` / `getTheme` now fall back to `"dark"` (not
  `"light"`) when no saved choice and no OS preference is detected. The
  saved-choice + `prefers-color-scheme` paths are unchanged.

### Wiki / fleet rules

- `planning/wiki/concepts/i18n-ko-en.md` — i18n contract
- `planning/wiki/concepts/responsive-3tier.md` — viewport contract
- `planning/wiki/concepts/theme-system-dark-fallback.md` — theme contract

## 0.27.0

Adoption-first refinements to `useInAppBack` + `<BackButton>` (shipped
v0.8.0) so the SPA navigation contract from
`planning/wiki/concepts/spa-navigation-state.md` can be satisfied by
one line of consumer code. No new conceptual primitives — the existing
hook stays the same shape; this release makes it the lowest-friction
choice.

- `<BackButton fallback>` — the button now mounts `useInAppBack`
  internally when no `canGoBack`/`goBack` props are passed. Consumers
  can drop in `<BackButton fallback="/more" />` (or
  `fallback={() => router.push("/more")}` for Next.js) and the button
  does the right thing on both warm in-app navigations (`history.back()`)
  and cold entries (use the fallback). The previous explicit-hook shape
  — `<BackButton {...useInAppBack({ … })} />` — keeps working.
- `useInAppBack({ fallback })` — accepts the same `string | () => void`
  union. String fallbacks pushState + dispatch popstate so vanilla
  hash/path routers re-render without a full reload.
- `runInAppBackFallback(fallback)` exported — useful for non-button
  trigger points (swipe gesture, keyboard shortcut).
- `onExit` is now `@deprecated` in JSDoc and routed through the same
  code path as `fallback`; existing v0.8.0–v0.26.0 callers keep working.
- Bootstrapped Vitest (jsdom + @testing-library/react) and a
  `tests/backButton.test.tsx` covering the new shape + back-compat
  paths (12 cases). `pnpm test` is now a CI gate alongside `typecheck`
  and `build`.

## 0.26.0

- `<DocsHub>`: `DocsHubSkill.publicUrl` — when set, the default Claude-skill
  usage section leads with a `curl -fsSL <publicUrl> -o
  ~/.claude/skills/<slug>/SKILL.md` one-liner (with copy button) instead of
  the manual download-and-move flow. The download button stays as fallback
  for offline/airgapped installs. Convention: every consumer app serves the
  same skill markdown bytes at `https://<app>.m.etamong.com/skill.md`. See
  `wiki/concepts/docs-hub.md` (planning!158).
- New styles `.etu-docs-hub-skill-install{,-cmd,-note}` for the one-liner
  card.

## 0.25.0

- `<DataTable>` primitive — responsive table that renders as a wide table on
  desktop and as a row-per-field card list on narrow viewports, driven by
  container queries.
- `<Sidebar>` accepts `secondarySections: { id?, caption?, items }[]` for
  captioned secondary subgroups (large-app shape). The existing
  `secondary: SidebarItem[]` stays for small apps; when both are passed
  `secondarySections` wins. Adds `.etu-sidebar-section-caption` styles
  and exports the `SidebarSecondarySection` type.

(0.24.0 was never tagged; both features ship together as 0.25.0.)
