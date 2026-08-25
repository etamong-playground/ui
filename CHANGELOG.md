# Changelog

## 0.49.0

`PageContainer`, `PageHeader`, `SettingsGroup`, and `SettingsRow` add the
shared seam for responsive page measure, restrained title hierarchy, compact
settings rows, and a visually separate danger zone. Typography size and
line-height tokens plus `.etu-type-*` classes keep app-owned feed and campaign
content on the same hierarchy. The showcase covers single-item and multi-row
settings states at phone, tablet, and desktop widths.

## 0.48.0

Bell placement correction (planning#1133 §6, operator: "프로필 근처 어딘가에
뜨는게 맞음") — v0.43 put the bell in the sidebar's nav list; that read as a
destination sitting next to Dashboard/Docs, which it isn't. Our bell opens a
popover of recent items and routes elsewhere — an **ephemeral stream**, not
a first-class triageable object with its own URL-worthy state (Linear's/
Notion's Inbox are the triageable kind and legitimately earn a nav row;
GitHub's/Vercel's/Figma's/Slack's bell is the ephemeral kind and sits beside
identity instead). Apply that test — object substance, not product
category — before mounting anything else in the nav list.

- New `<Sidebar footerAccessory>` prop: a trailing control rendered beside
  `footer` in the identity row. Expanded: sits to the right of the identity
  trigger in one flex row (not stacked, not full-width). Collapsed rail:
  stacks as its own icon-only item directly above the (avatar-only-degraded)
  identity control, badge intact — the bell's own badge is bounded to
  `"99+"` by the component itself, so it always fits the ~40px trigger and
  stays a pill at both widths (unlike `SidebarItem.badge`, which degrades to
  a corner dot on collapse because it's unbounded caller-supplied text).
  Optional — omitting it leaves the footer exactly as before, and a `footer`
  that renders multiple top-level nodes (the documented identity + Logout +
  DeployInfo shape) is unaffected: it only gets wrapped for flex layout once
  `footerAccessory` is actually present.
- DOM order for `footer`/`footerAccessory` tracks the visible order in both
  states (identity-then-bell expanded, bell-then-identity collapsed) — not a
  CSS-only visual reorder — so keyboard tab order and screen-reader linear
  reading never diverge from what's on screen.
- New `NotificationBell` `variant="footer"`: visually identical to the
  default `variant="trigger"` icon button, but portals its popover like
  `"row"` does — the sidebar footer sits inside `<Sidebar>`'s own
  `overflow: auto` region, which clips a non-portaled absolutely-positioned
  panel at any rail width. Also force-closes (and skips the mobile
  body-scroll lock) when the viewport crosses into the mobile tier, same as
  `"row"` — the sidebar is CSS-hidden below 720px, not unmounted, so a
  stale-open instance would otherwise fall into the full-screen mobile-sheet
  branch it was never meant to take. A dev-only console warning fires if a
  `NotificationBell` ends up inside `<Sidebar footerAccessory>` without
  `variant="footer"` (or `"row"`) — otherwise the popover-clipping bug above
  is invisible until someone reports "clicking the bell does nothing."

### Behavioral notes for 0.48

- `<NotificationBell variant="row">` (v0.43, mounted via
  `SidebarItem.render`) is **deprecated, not removed** — existing consumers
  keep working unchanged. New integrations should use
  `<Sidebar footerAccessory>` + `variant="footer"` instead, unless the
  notification surface genuinely is a triageable object per the test above.
- No prop removals or renames, and no change to any existing variant's
  rendered output — `footerAccessory` and `variant="footer"` are purely
  additive. Apps that don't pass `footerAccessory` see no visual change.

## 0.47.0

- New `./rum` subpath entry: fleet real-user-monitoring init (`initRum`) plus
  `pushApiError` (Grafana Faro under the hood) — the client half of the fleet
  RUM pipeline (planning#1179, ADR `concepts/fleet-rum`). Web vitals, unhandled
  errors, session tracking, and page-lifecycle breadcrumbs, correlated with the
  server error log via the shared 8-hex `ref` code. `@grafana/faro-web-sdk` is a
  declared optional peer — non-adopters install nothing. No-PII by construction:
  console capture off, no `setUser`, query strings stripped from reported URLs.

## 0.46.0

- New `.etu-input` class recipe (+ `.etu-input--sm` modifier): the generic
  standalone text field, promoted from meloetta's local `.input` recipe
  (planning#1116 follow-up). Border/background/focus-ring only — layout stays
  with the caller, matching the `.etu-badge` recipe philosophy.

## 0.45.0

Two rail/mobile reachability bugs found adopting v0.44 across the fleet
(planning#1150, planning#1151) — both the same story: the bell and the
account menu must actually be reachable in the collapsed rail and on
mobile, not just present in the DOM.

### Collapsed rail — identity footer no longer disappears (planning#1150)

- `<Sidebar footer>` used to hide entirely (`display: none`) once the rail
  collapsed to 64px. That was defensible while the footer held only an
  identity row, but stopped being defensible the moment v0.43 moved the
  theme toggle *into* the `UserMenu` popover — the footer became the only
  entry point to identity, sign-out, **and** the theme toggle, and hiding it
  cut off all three.
- Fix: the canonical `<UserMenu variant="full">` footer now degrades to an
  **avatar-only** control when the rail collapses — same ~40px target as
  every other rail item, opening the same portaled `UserMenu` popover.
  Name, email, and any badges still hide; only the avatar survives,
  mirroring how nav rows degrade to icons.
- An arbitrary custom `footer` node (not `<UserMenu variant="full">`) still
  collapses to nothing — the package can't safely rewrite unknown markup to
  fit a 64px column. If your footer needs to survive the rail collapse,
  build it on `<UserMenu variant="full">`.

### Mobile bell sheet — portaled out of `NavigationBar`'s glass (planning#1151)

- `<NotificationBell>`'s default `variant="trigger"` mobile sheet (+
  backdrop) wasn't portaled to `document.body` — only `variant="row"` was.
  `<NavigationBar>` always applies `backdrop-filter` (`.etu-glass`), which
  — like `transform`/`filter`/`perspective` — makes it a containing block
  for `position: fixed` descendants. A bell mounted in
  `<NavigationBar trailing>` (the documented mobile placement since v0.43)
  had its sheet anchored to the header instead of the viewport bottom.
- Fix: the mobile sheet + backdrop now portal to `document.body`, reusing
  the same `createPortal` call the row variant already used. The desktop
  popover (`position: absolute` against the bell's own `position: relative`
  wrapper) was checked and is unaffected — its containing block is already
  the wrapper, closer in the tree than any `.etu-glass` ancestor — so it's
  untouched.
- Checked `<MobileTabBar>` (the other `.etu-glass` consumer) for the same
  trap: it renders no `position: fixed` descendants of its own, so nothing
  to fix there. `<UserMenu>`'s dropdown and the cmdk `<CommandPalette>`
  dialog were already unconditionally portaled before this change.

### Behavioral notes for 0.45

- Collapsed-rail `<Sidebar footer>` renders visibly (avatar-only) where it
  previously rendered nothing, for any app using the canonical
  `<UserMenu variant="full">` footer — the fix in this release. A custom
  non-`UserMenu` footer is unaffected (still hides collapsed, as before).
- `<NotificationBell variant="trigger">`'s mobile sheet position changes
  for any app that mounts it inside `<NavigationBar trailing>` (or any
  other `backdrop-filter`/`transform`/`filter` ancestor) — it now
  bottom-anchors to the viewport as documented, instead of the broken
  header-anchored position. Apps that worked around the bug (e.g. reverting
  to no mobile bell surface, as `pages` did) can restore the mobile
  placement.

## 0.44.0

Standard push-permission affordance (planning#1140). The package shipped zero
push-permission handling — only `res-train` had a hand-rolled one — so every
app that wanted push reinvented the state machine. This adds the shared
piece: permission + affordance only, never the subscription itself.

### `usePushPermission()`

- New hook: `{ state, supported, canPrompt, isBlocked, needsInstall, prompt() }`.
- `state`: `"unsupported" | "needs-install" | "default" | "granted" | "denied"`.
- `supported` is `false` only for `"unsupported"` (no `Notification` /
  `PushManager` / service-worker — older WebViews, kiosk browsers).
- `needsInstall` covers iOS Safari's prerequisite — web push only works once
  the PWA is installed to the Home Screen. Detected by calling
  `useInstallPrompt()` internally (the same `isIOS`/`isStandalone` signals
  `<InstallBanner>` already computes), so the two can't drift apart.
- `isBlocked` is `state === "denied"`. Browsers never re-prompt after a
  denial, so `prompt()` is a no-op (returns the current state without
  calling the native API) unless `state === "default"` — a stray call after
  a denial can never re-trigger a prompt the platform would refuse anyway.

### `<PushEnableRow>`

- One presentational row — used both inside `<NotificationBell>`'s popover
  and standalone on a settings page — driven entirely by a
  `usePushPermission()` result passed in as `permission`.
- Renders per state: the enable affordance (`"default"`), the install path
  (`"needs-install"`, text-only — no programmatic iOS install prompt exists),
  a re-enable explanation (`"denied"`, no button), nothing (`"unsupported"`),
  and nothing-or-a-quiet-confirmation (`"granted"`, via
  `showGrantedConfirmation`).
- `onEnabled` fires once permission is newly granted via the row's own
  button — the package stops there; do the actual
  `registration.pushManager.subscribe(...)` + your app's own
  `/api/push/subscribe` POST from that callback. No VAPID keys or endpoints
  are baked into the package.
- All copy is overridable via `labels`, following the same Korean-default /
  prop-override pattern as `<InstallBanner>`.

### `<NotificationBell push>` (opt-in)

- New optional `push` prop: `{ permission, onEnabled?, labels? }`. Omitting
  it leaves `NotificationBell` exactly as before — existing consumers are
  unaffected.
- When set and `permission.state === "default"`, the popover/sheet shows
  `<PushEnableRow>` above the items list, and the trigger carries a quiet
  hollow-ring setup dot (`.etu-notif-bell-setup-dot` / the row-variant
  `--setup` modifiers) — visually distinct from the filled unread badge, and
  suppressed whenever there's a real unread count to show instead. One
  nudge, not a recurring nag: the dot disappears the moment the user
  decides, either way.
- No banner. The ask lives in the bell popover (an already-demonstrated-
  intent moment) and the settings row — never a third full-width strip
  stacking on `StatusBanner`/`PolicyChangeBanner`.

### Behavioral notes for 0.44

None — `push` on `<NotificationBell>` is a new optional prop with no
default, and `usePushPermission`/`PushEnableRow` are new exports. Nothing
existing changes visually or behaviorally without opting in.

## 0.43.0

Sidebar structure pass (planning#1133) — the desktop collapse affordance, rail
parity, the identity footer, and where the notification bell/theme toggle live
all move to match the reference UI. Presentation + placement, not new state.

### Collapse control

- The rail-collapse chevrons button — previously a separate row floating
  below the brand, reading as an afterthought — now lives in the sidebar
  header row, pinned to the trailing edge and vertically aligned with the
  app name/icon. Same `⌘/Ctrl+B` shortcut, same `useSidebarDrawer` behavior,
  unchanged.
- Collapsed rail: the app name/icon hide and the toggle becomes the sole
  visible header control — the top item of the rail, so re-expanding stays
  discoverable without hovering.

### Rail parity

- Collapsed rail keeps the same item order/grouping/vertical rhythm as
  expanded (unchanged from v0.37 — no code change needed, called out here
  because it's now paired with the caption fix below).
- Section captions (`secondarySections` captions, `secondaryCaption`)
  collapse to a subtle 1px divider instead of vanishing outright — without
  it, a second-or-later `secondarySections` group (no border-top of its
  own) lost all visual separation from the group above once collapsed.
- Quiet caption treatment: `--etu-fs-caption` / `--etu-text-subtle`
  unchanged, but `font-weight` drops from `--etu-fw-semibold` to
  `--etu-fw-medium` and the top padding/margin grows, so a caption reads as
  a label, not a competing heading.

### Identity footer + UserMenu

- `<UserMenu variant="full">` — a full-width avatar + name + email trigger,
  opening the same popover as the existing avatar circle. This is now the
  canonical `<Sidebar footer>` control.
- `<UserMenu themeToggle={{ appKey }}>` — adds a light/dark row to the
  popover, backed by `getTheme`/`setTheme`. The theme toggle's canonical
  home now, not a loose footer icon.
- `<UserMenu badges={[{ label, tone? }]}>` — role/permission pills under
  the name, independent of the existing `admin` pill (`showAdminBadge`);
  reuses the shared `.etu-badge` classes.
- All three are new optional props — existing `<UserMenu>` usage (avatar
  trigger, no badges, no theme row) is visually unchanged.

### Bell and theme placement

- `<NotificationBell variant="row">` — a full-width `.etu-sidebar-item` row
  (icon + `label` + count), meant to be mounted via the new
  `SidebarItem.render`. Reuses the same `.etu-sidebar-item*` classes
  `<Sidebar>` itself uses, so it inherits rail-collapse (icon-only, badge →
  dot) for free. The desktop popover now renders through a portal to
  `<body>` (row variant only) so it isn't clipped by the sidebar's own
  `overflow: auto` at any rail width, including the 64px collapsed column.
  The existing standalone `variant="trigger"` (default) is unchanged.
- `SidebarItem.badge` — a trailing indicator (unread count, status dot) on
  any plain nav row. Expanded: a pill after the label. Collapsed rail:
  degrades to a small dot overlaid on the icon's corner via a pure CSS
  swap (no JS branching on collapse state) instead of disappearing.
- `SidebarItem.render` — escape hatch that replaces a row's default
  button/link markup entirely, for rows that need to own more than an
  `onClick` (`NotificationBell`'s `"row"` variant is the reference
  implementation).
- Convention: the bell is a nav row (desktop/rail) or
  `<NavigationBar trailing>` (mobile, since the sidebar is hidden below
  720px) — never the sidebar footer, and never paired with the theme
  toggle. `NotificationBell` itself is unchanged/not deprecated, only the
  footer-icon-cluster placement is retired; nothing in this package's own
  showcase mounts it there.

### Behavioral notes for 0.43

Visible changes an app might notice after bumping to 0.43, without any code
change on the app's side:

- **Section captions are lighter.** `--etu-fw-semibold` → `--etu-fw-medium`
  on `.etu-sidebar-caption` / `.etu-sidebar-section-caption`, with more space
  above. Purely visual.
- **The rail toggle moved.** From a standalone 40×40 button centered in its
  own row below the header, to the same 40×40 button inside the header row,
  pinned to the trailing edge. Apps that pass `appIcon` and/or `appName`
  alongside `tabletMode="rail"` will see this shift automatically — no prop
  change needed.
- **The app icon/name hide on collapsed rail** (previously the icon stayed
  visible, centered). The toggle is now the sole top-of-rail control while
  collapsed.
- **`.etu-sidebar-header-name` truncates with an ellipsis** instead of
  wrapping/overflowing when the app name is long enough to compete with the
  now-inline toggle button.
- **Section captions collapse to nothing on a collapsed rail**, except a
  second-or-later `secondarySections` group, which gets a subtle 1px divider
  stand-in — its own section border is reset to 0 (see "Rail parity" above),
  so without the stand-in it loses all separation from the group before it.
  The first group and the single flat-`secondary` caption keep relying on
  their section's own border-top instead, so they don't grow a second,
  redundant line next to it.

### Review round fixes

- `SidebarItem.badge` is now folded into the row's `aria-label` (e.g.
  `"알림 (3)"`) instead of being silently dropped — `aria-label` overrides all
  descendant text per the accessible-name algorithm, so the visible badge
  pill was never announced, collapsed or expanded. The pill itself is now
  `aria-hidden` in that case to avoid double-counting.
- `<UserMenu>`'s dropdown now renders through a portal to `<body>` with
  viewport-fixed coordinates, same as `<NotificationBell variant="row">`'s
  popover — it was clipped by `<Sidebar>`'s `overflow-y: auto` when mounted
  as the `variant="full"` footer control.
- Popover positioning (`<NotificationBell>` + `<UserMenu>`) is now a single
  `useLayoutEffect` pass, shared via an internal `usePopoverPosition` hook —
  side-flip and portal offset used to be two effects, the second reading a
  stale placement from its own closure and painting the panel at the wrong
  spot for one frame. Both axes are now clamped to the viewport (not just the
  anchor edge), against the panel's real measured size (not a hardcoded
  constant that had drifted from the CSS), and recompute on scroll too, not
  just resize.
- `<NotificationBell variant="row">` no longer opens a full-screen mobile
  sheet if it was left open when the viewport crosses below 720px —
  `<Sidebar>` is CSS-hidden there, not unmounted, so the row instance used to
  survive and strand an orphaned sheet, complete with a body-scroll lock the
  user never asked for.
- `<NotificationBell variant="row">` now always has an accessible name,
  including at 0 unread — it previously fell back to `undefined` instead of
  the plain label, unlike the standalone trigger variant. It also carries the
  same `title` tooltip the default `Item()` row markup does.
- Collapsed-rail section captions are now `aria-hidden` — `font-size: 0` /
  `color: transparent` alone isn't reliable removal from the accessibility
  tree. Safe because the group name is already exposed via the enclosing
  `<nav aria-label>`.
- Dev-only `console.warn` when `SidebarItem.render` is combined with
  `href`/`onClick`/`active`/`badge` — those fields are silently ignored;
  mirrors the existing `secondary` + `secondarySections` warning.

## 0.42.1

Fix (planning#976) — `@playwright/test` and `msw` are no longer `peerDependencies`
(optional or otherwise). Declaring them, even as optional peers, made some consumers'
production dependency-report tooling count them (and their transitive trees) as part
of the shipped app, ballooning third-party-notices output. They stay as this repo's
own `devDependencies`; the `./testing` export (which imports them at runtime) is
unaffected — apps that use it already install `msw`/`@playwright/test` themselves for
their own tests.

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

### Round-2 review fixes

- `.etu-navbar--scrolled` frosted background (`color-mix()` + `backdrop-filter`
  blur) is now gated behind a combined `@supports` check (backdrop-filter OR
  its `-webkit-` prefix, AND `color-mix()`); elsewhere it falls back to a
  solid `var(--etu-surface)` background instead of risking a translucent
  background with no blur.
- Radius bumped on overlay/card surfaces: dialog + `ErrorPage` card
  `--etu-r-lg` 12px → 16px; `UserMenu` dropdown + `NotificationBell` popover
  `--etu-r` 9.6px → 12px.
- `StatusBanner` and the install/policy banner family now read the shared
  `--etu-warn-soft` / `--etu-accent-soft` / `--etu-err-soft` tokens (solid
  text colors) instead of a private inline `color-mix()`, so overriding the
  base warn/accent/err tokens re-themes them too.
- `AdminBadge` now composes `etu-badge etu-badge--accent etu-admin-badge`
  instead of a private style block.
- Solid-first double declarations added for the remaining ungated
  `color-mix()` surfaces, so engines without `color-mix()` support fall
  through to a solid color instead of resolving invalid-and-transparent.

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
