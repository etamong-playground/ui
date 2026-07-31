# Changelog

## 0.42.0

Design-token overhaul (planning#1081) — the neutral ramp, focus ring, page-width
contract, and a first batch of component polish all land in one release.

### Token layer

- Neutral ramp rebuilt to follow the [Radix Colors](https://www.radix-ui.com/colors)
  scale steps (`bg`=1, `surface`=2, `surface-2`=3, `surface-3`=4/5), adding
  `--etu-surface-3` and `--etu-border-strong`. Dark values are Radix `slateDark`;
  dark-mode borders are white-alpha so they self-adjust to whatever surface sits
  beneath (in-page cards use borders, not shadows — `--etu-shadow`/`-sm` are
  reserved for true overlays: palette, dialogs, menus).
- New `--etu-warn` status token (+ `--etu-warn-soft`), alongside existing `--etu-ok`
  / `--etu-err`.
- Derived tints (`--etu-accent-strong`, `--etu-accent-text`, `--etu-accent-soft`,
  `--etu-ok/-warn/-err-soft`) each ship a **solid default**, then re-derive via
  `color-mix(in oklab, …)` inside an `@supports (color: color-mix(...))` gate —
  overriding a base token (e.g. `--etu-accent`) cascades into every tint on
  capable engines, and old WebViews/kiosk Safari fall through to the solid
  palette instead of going invalid-and-transparent.
- New `--etu-ring` focus token, deliberately **solid** `var(--etu-accent)` —
  excluded from the `color-mix()` gate on purpose so `focus-visible` outlines
  never lose WCAG 1.4.11 contrast.

### Type scale + font loading

- `--etu-fs-caption` … `--etu-fs-3xl` type scale, `--etu-lh` / `--etu-lh-tight`,
  `--etu-fw-medium` / `-semibold` / `-bold`.
- `--etu-font` now leads with `"Pretendard Variable"`. The library still doesn't
  bundle the font — README documents the Vite (`pretendard` package CSS import)
  and Next.js (`next/font/local` + the package's `woff2`) loading recipes.
  `pretendard` (`>=1.3.9`) is an **optional peer dependency**.
- `:lang(ko)` tracking correction (`-0.011em`) scoped to Korean-tagged documents
  so Latin/numeral-heavy EN UIs stay at `0`.

### Spacing, motion, radius scales

- `--etu-space-1` (4px) … `--etu-space-8` (64px).
- `--etu-t-fast` (120ms), `--etu-t` (160ms), `--etu-ease`.
- `--etu-r-sm` / `--etu-r` / `--etu-r-lg` / `--etu-r-full` (unchanged values,
  now documented as the formal radius scale).

### Page-width contract

- `--etu-page-w-narrow` (520px) / `--etu-page-w` (680px) / `--etu-page-w-wide`
  (1080px) back the new `.etu-page-col` (+ `--narrow` / `--wide` modifiers)
  utility — a centered reading-width column, physical-margin fallback before
  the logical `margin-inline`/`padding-inline` properties for older engines.
  Fixes the "content floats in a huge dark void" failure mode on wide
  viewports. `BackofficeLayout` and `ErrorPage` are now width-constrained via
  this contract instead of stretching full-bleed.

### New utilities

`.etu-h1` / `.etu-h2` / `.etu-h3` (headings), `.etu-caption` (muted small text),
`.etu-tnum` (tabular numerals), `.etu-badge` (+ `--accent` / `--ok` / `--warn` /
`--err` modifiers — soft-tint status/label pills).

### Component polish

- `focus-visible` outlines (`--etu-ring`) added consistently across interactive
  components that were missing them.
- Interactive controls (buttons, inputs) standardized to a 40px height floor.
- In-page elevation switched from shadows to `--etu-border` / `--etu-border-strong`
  across cards/panels (dark-mode borders are white-alpha, see above).
- `DeployInfo`, `RelTime` (`.etu-tnum`), and `DataTable` numeric cells now set
  `font-variant-numeric: tabular-nums` so live-updating digits don't jitter
  row/column width.

### Bugfixes

- `--etu-dim` / `--etu-border-subtle` — components referencing these
  now-undefined tokens fall back correctly instead of resolving to `unset`.
- `--etu-accent-on` typo (the token is `--etu-on-accent`) and `--etu-font-mono`
  typo (the token is `--etu-mono`) fixed at both call sites.

### Showcase

- New `design-tokens` registry entry + `TokensSection` badge/page-width demos
  now use the shipped `.etu-badge` classes instead of a showcase-private demo
  class.

## 0.41.0

`body.etu-page` — opt-in page-shell paint (`margin: 0; background: var(--etu-bg);
color: var(--etu-text); font-family: var(--etu-font);`). `styles.css` deliberately
paints only the library's own namespaced `--etu-*` components so it stays safe to
import into any app, including shadcn/Tailwind apps that own their own `body` rule
— that also means every app had to hand-wire the page shell itself, and forgetting
it renders dark-mode text invisible on the browser's default white body (ui#21, a
real incident). `body.etu-page` gives apps that same ~5 lines as a scoped opt-in
class instead of a bare `body {}` rule, so the safe-to-import-anywhere contract is
unchanged for consumers that don't opt in. See planning#835.

## 0.39.0

`inAppBreakout()` + `isInAppBrowser()` — get users out of embedded WebViews
(KakaoTalk / Instagram / Facebook / LINE / Naver) before the shared Google
login, which Google blocks with `403 disallowed_useragent`. `fleetSignIn()`
(and therefore `<AuthGate>`, `<LoginButton>`, `useIdentity().signIn`) now tries
to reopen the `/auth/login` URL in the system browser first — KakaoTalk/LINE
via their external-browser scheme, Android via a Chrome `intent://` — before
the normal navigation. In-app browsers with no scheme fall through so the
service-edge `/auth/login` interstitial can show its open-in-browser guide.
Whitelist of known-bad in-app UAs, never a catch-all `wv` (Chrome Custom Tabs /
SFSafariViewController are valid OAuth surfaces). Also exported from
`@etamong-playground/ui/helpers` for non-React callers. See planning concept
`in-app-browser-breakout` (planning#925).

## 0.33.0

`<LegalMenuItem appSlug>` + `<LegalPage appSlug>` + `useLegalAvailability(appSlug)` —
three primitives for the fleet-wide `/more` → `법률 정보 ›` → `/more/legal` three-level
grouping (see planning concept `legal-section-pattern`). The hub manifest
(`legal.m.etamong.com/api/public-manifest`) drives which doc rows render at the second
level; the top-level `법률 정보 ›` row is unconditional so per-app published-doc
differences never produce menu jitter. L1 `로그인 정책` row is pinned last on every
app. `<LegalRow>` is also exported so apps compose sibling rows (e.g. 문의하기 mailto)
into the same `.etu-legal-card`. SWR-style hook (1h soft TTL / 24h hard TTL,
localStorage cache). Empty L2 state: `로그인 정책` row + a single muted line —
suppressed while loading / on a transient fetch error so an offline blip doesn't read
as "this app legally has nothing".

## 0.32.1

`<Sidebar>` — sticky on tablet+desktop. `.etu-sidebar` now uses
`position: sticky; top: 0; height: 100dvh; overflow-y: auto;
align-self: flex-start;` so header / primary nav / secondary nav stay
visible regardless of page scroll. Long sidebars scroll internally
instead of scrolling out of view with the page body. Fixes alert-ops
Console (200+ firing alerts) where only the `margin-top:auto` footer
remained visible at the bottom. Drawer (`position: fixed`) and rail
modes unaffected; desktop-tier drawer override switched from `static` →
`sticky` so it doesn't regress.

## 0.32.0

`<NotificationBell items count? onOpen? footer? placement?>` — fleet-wide
bell-icon notification surface. Click opens a popover dropdown on
desktop/tablet (anchored to the trigger, same placement contract as
`<UserMenu>`) and a bottom sheet on mobile (iOS-native pattern: backdrop +
slide-up + safe-area inset + body-scroll lock). The component is
content-agnostic — consumers pass an `items` array with rendered `content`
nodes and any inline actions.

Replaces per-app "inbox" tabs / routes: incoming notifications (access
requests, deploy completions, mentions) belong on a global header bell,
not in the primary nav. First consumer = pages access-request inbox.

Styled via `.etu-notif-bell*` (trigger / badge / popover / sheet / item /
empty / footer). Badge auto-renders as `99+` past 99.

## 0.31.0

`<OpenInBrowserButton href>` — uniform fleet affordance for "open this URL in
the system default browser." Wraps an `<a target="_blank" rel="noopener
noreferrer">` styled as a button with an external-link glyph. On installed
PWAs (iOS standalone, Android Chrome) `target="_blank"` already pops the link
out to Safari / Chrome rather than navigating away the PWA window; the
component exists so the visual affordance is consistent across apps instead
of each one re-rolling its own icon button.

Props: `href`, `label` (default `"브라우저에서 열기"`), `icon`, `iconOnly`,
`ariaLabel`, `variant: "ghost" | "primary"` (default `ghost`, matching
`<CopyButton>`), `className`, plus pass-through `AnchorHTMLAttributes`.
Styled via `.etu-open-in-browser-button` (+ `--ghost` / `--primary` /
`--icon-only` modifiers).

Use for external docs, OAuth handoffs, payment provider redirects, sibling
fleet apps the user hasn't installed yet — anywhere that staying inside the
PWA shell would be the wrong default.

## 0.30.0

Fleet-auth primitives — implements the route contract documented at
`planning/wiki/concepts/fleet-auth.md` (planning#252) so apps can stop
hand-rolling login/logout/expired-session UI and the
oauth2-proxy-vs-in-app-OIDC split can be retired.

- `AuthGate` — gates a subtree on `/api/me`; anonymous browser navigation
  → redirect to `/auth/login?rd=<here>`. Share-preview crawlers (UA
  match — same list as `og-share-previews`) and SSR get `children`
  unconditionally so the static `<meta og:*>` block stays readable.
- `useIdentity()` — thin wrapper around `useMe()` with fleet defaults
  (`/api/me`, 401-as-anonymous) + `signIn`/`signOut` bound to the fleet
  URLs.
- `LoginButton` / `LogoutButton` — standard pill buttons.
- `SessionBadge` — sidebar bottom-slot user pill (avatar circle + name).
- `SessionExpiredDialog` — global; listens for `etu:session-expired` and
  prompts re-sign-in. App's XHR layer dispatches the event on `/api/*`
  401 after the initial me-fetch succeeded.
- `fleetLoginUrl` / `fleetLogoutUrl` / `fleetSignIn` / `fleetSignOut` —
  URL + redirect helpers for `/auth/{login,logout}`.
- `isShareCrawler(ua)` + `SHARE_CRAWLER_UA_SUBSTRINGS` — the single
  source of the crawler UA list; mirrored by `shared/libs/auth-go` and
  `apps/pages/apiserver/main.go`.
- `notifySessionExpired()` / `refreshIdentity()` — event dispatchers
  apps can call from their fetch wrapper.

Legacy `useMe`/`signInUrl`/`signOutUrl` (oauth2-proxy paths) remain
exported unchanged — apps still on the sidecar keep working.

## 0.29.1

Fix Next.js RSC consumers crashing with `g.createContext is not a function`
when a server component imports anything from `@etamong-lab/ui` (root
entry). The bundled `dist/index.{js,cjs}` evaluates several modules that
call `createContext()` at module-init time (`i18n.tsx`, `viewport.tsx`,
`toast.tsx`, `statusBanner.tsx`, …); the RSC build of React doesn't expose
`createContext`, so server-loading the barrel exploded.

- Mark `src/index.ts` as `"use client"` so the bundled barrel ships as a
  client module. Drawn at the package boundary — server components in
  Next.js apps can still import & render any of these and pass primitives
  as props.
- `./helpers` (framework-agnostic) and `./testing` (test-only) stay
  server-safe — they have separate tsup entries and no client directive.

Caught by res-train `build-web` after the 0.28 bump: `/me` page is a
server component that imports `Avatar` from the root entry.

## 0.29.0

`@etamong-lab/ui/testing` extension — three fleet-wide test helpers in one
optional entry. Apps that don't import them pull no extra peer (`msw`,
`@playwright/test` are optionalPeerDependencies).

- **MSW helpers** (`createMeHandler`, `createMeSignedOutHandler`,
  `createHealthzHandler`, `defaultMockHandlers`, `httperrBody`,
  `mockHttperrRef`). Mock the two endpoints every fleet webui shares
  (`/me`, `/healthz`) and the httperr `{error, ref}` body without
  re-deriving them per app.
- **Playwright fleet fixture** (`fleetTest`) — `test.extend` preset that
  sets `locale: "ko-KR"` + `timezoneId: "Asia/Seoul"` +
  `Accept-Language: ko-KR` + default desktop viewport, matching the
  production [[fleet_language_policy]] defaults so tests don't drift.
- **Viewport-fit assertions** (`assertViewportFit`,
  `defineViewportFitTests`, `FLEET_VIEWPORT_PROFILES`) — unchanged from
  0.28.1+, now re-exported from a barrel alongside the new helpers.

Internal file split: `src/testing-viewport-fit.ts`, `src/testing-msw.ts`,
`src/testing-playwright.ts`; `src/testing.ts` is a barrel. tsup entry
unchanged, public `./testing` export unchanged.

Relates to etamong-lab/planning#244 #249.

## 0.28.2

iPhone PWA staleness — proactive detection for the "browser never
observes a new SW after deploy" failure mode (the canonical cause of
"the app updates very slowly on iOS PWA"). Same pattern as the
viewport-fit assertions shipped in 0.28.1 (planning
concepts/viewport-fit-assertions): catch the bug at the developer's
localhost first, not at a user report.

- `registerServiceWorker(url, { currentBuild })` — new option. Pass the
  deploy SHA (typically the same one fed into `<DeployInfo>`). When
  set, the helper fetches `url` with `cache: "no-store"`, hashes the
  body, and persists `{ url, swHash, build }` in `localStorage`. On the
  next reload, if `build` changed but the SW body is byte-identical,
  it emits a `console.warn` naming the SW URL, the SHA change, and the
  fix (stamp the SW source with the build SHA via `__BUILD_ID__` + Vite
  `define`, or generate the static `sw.js` at build time).
  - Dev-only — production short-circuits via `NODE_ENV === "production"`
    so neither the fetch nor the storage write runs in prod bundles.
  - One warning per detected event per session.
- The existing 2-minute `registration.update()` polling +
  `visibilitychange` refresh + `controllerchange` reload remain the
  authoritative update path — they handle the "SW *is* per-build but
  the registration isn't aggressively polled" half of the staleness
  story. The new check covers the *other* half.

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
