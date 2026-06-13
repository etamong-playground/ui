# @etamong-lab/ui

Shared frontend scaffold for etamong-lab apps. Ships the design-token contract
(`styles.css`), the **cmdk command palette** + discoverable trigger, Korean-IME-
safe go-to shortcuts, **toast + dialog** notification primitives, and the
**`DeployInfo`** build-version badge. Conventions: see the planning wiki
(`concepts/frontend-conventions`, `design-system`, `command-palette`,
`app-notifications`, `build-version-info`).

Published to this project's GitLab npm registry; consumed by all 8 app
frontends. **Current: v0.4.** Releasing + consuming are documented at the bottom.

Works in both house stacks — Next.js (React 19) and Vite + apiserver (React 18).
React/ReactDOM are peer deps.

## What's in the box

| Export | Kind | What | Mount |
|---|---|---|---|
| `styles.css` | CSS | Design tokens (`--etu-*` namespaced; light/dark) + all component styles | Import once at the app root |
| `CommandPalette` | React component | The ⌘K palette: grouped sections, cross-locale keyword search, `adminOnly` filter, always-mounted search-actions row | Once, globally, when authenticated |
| `CommandPaletteTrigger` | React component | Discoverable "Search… ⌘K" search-box button (so users find the palette); dispatches `command-palette:open` | Sidebar / header |
| `useGoToShortcuts` | React hook | `g`-prefix two-key navigation, **Korean-IME-safe** (`e.code` fallback) | Call once where the palette mounts |
| `Toaster` | React component | Renders the toast queue (bottom-center) | Once at the app root |
| `toast(msg, kind?)` | function | Show a transient toast (`kind: "ok" \| "err" \| "info"`); returns id, dismissable | Anywhere |
| `DialogHost` | React component | Renders the pending `uiConfirm` / `uiPrompt` | Once at the app root |
| `uiConfirm(opts)` | Promise | Modal confirm; resolves `boolean` | Replaces `window.confirm` |
| `uiPrompt(opts)` | Promise | Modal text prompt; resolves `string \| null` | Replaces `window.prompt` |
| `DeployInfo` | React component | "deployed `<sha>` · `<rel time>`" badge; renders `null` when no build env | App-info section (settings / backoffice) — **not a footer** |
| `InstallBanner` | React component | Mobile-only PWA install banner. Real install button on Chrome/Android; "Share → 홈 화면에 추가" hint on iOS Safari; auto-hides when already installed | Once near the app root (same boundary as `<Toaster />`) |
| `useInstallPrompt()` | React hook | Lower-level — returns `{ canPrompt, promptInstall, isIOS, isStandalone }` for apps that want to render their own UI | Any client component |
| `ErrorPage` | React component | Full-page friendly error surface; pairs with the httperr `ref` pattern, no raw error / repo links leak | Error boundary / Next.js `error.tsx` / 404 fallback route |
| `useRouteState` | React hook | In-page state slice synced with the URL query string (works with both regular and hash routers); restores on refresh, syncs with back/forward | Tabs, filters, sort, search term, expanded row id |
| `useSessionState` | React hook | Same shape as `useRouteState` but backed by `sessionStorage`, keyed per route | Scroll offset, cmdk query, unsubmitted form draft |
| `useInAppBack` | React hook | Tracks an in-app history stack via a marker in `history.state`; returns `{ canGoBack, goBack, push, replace }` | Once per app — wire to a back button + every in-app nav |
| `BackButton` | React component | Token-styled back button; renders only when there's somewhere to go (or when `onClick` is set) | Above page headings / detail views |
| `createFetch` | factory | `fetch` wrapper: JSON in/out, parses the httperr `{error, ref}` body into an `HttpError`, redirects to `oauth2-proxy` sign-in on 401 | Once per app — `const api = createFetch({ baseUrl: "/api" })` |
| `HttpError` | class | Thrown for every non-2xx; carries `status`, `ref`, `body` — drop `err.ref` into `<ErrorPage refCode={...}>` | `try { … } catch (e) { if (e instanceof HttpError) … }` |
| `useMe` | React hook | Fetches `/api/me` (or a custom `fetcher`), returns `{ me, loading, error, refresh }`; treats 401 as anonymous by default | Once near the app root |
| `signInUrl` / `signOutUrl` / `signIn` / `signOut` | functions | `oauth2-proxy` sign-in/out URL builders + navigation helpers | Login buttons, post-auth redirects |
| `EmptyState` | React component | "Nothing here yet" card; title + optional description / action / icon, `role="status"` | Empty lists, empty search results |
| `CopyButton` | React component | Token-styled copy button with success-state flip ("복사" → "복사됨"); fires a toast on success/error | Secret reveal, token / slug / ref copy |
| `useClipboard()` | React hook | Lower-level — `{ copied, copy(value) }`; clipboard API + legacy fallback | When you want to render your own copy UI |
| `registerServiceWorker(url, opts)` | function | Registers a service worker with the etamong-lab update flow (aggressive `update()`, "새 버전" toast, auto-reload on `controllerchange`) | Once at app bootstrap, after window load |
| `networkFirstSwSource({ version, … })` | function | Returns the canonical online-first SW recipe as a string — write to `public/sw.js` at build time. Network-first nav + assets, never intercepts `/api/*`, versioned caches | Build step (or served dynamically) |
| `AdminGate` | React component | Renders `children` only when `me` passes `is_admin` / email allowlist / role / predicate (logical OR); otherwise renders `fallback` | Wrap any admin-only route or section |
| `AdminBadge` | React component | Small "관리자 전용" pill | Inline next to the page title |
| `BackofficeLayout` | React component | Page-head with title + AdminBadge + actions slot + body | Backoffice / admin-console route layout |
| `isAdminLike(input)` | function | The check behind `AdminGate` exposed as a pure function | Imperative gates / route guards |
| `AppInfoSection` | React component | Canonical "앱 정보" card — name, description, app version, build (`<DeployInfo>`), links, free-form rows | Settings / backoffice "About" route |
| `formatRelTime(when)` | function | `"3분 전"` / `"in 2 hours"` via `Intl.RelativeTimeFormat`; locale from the document | Lists, activity feeds, anywhere "ago" reads right |
| `formatAbsTime(when, opts?)` | function | Absolute time via `Intl.DateTimeFormat`; defaults to KST (`Asia/Seoul`) Korean. Style presets: `date` / `time` / `datetime` / `datetime-seconds` | Timestamps, log lines, tooltips |
| `RelTime` | React component | Auto-refreshing relative-time label (`<time dateTime>` with absolute time as `title`) | Anywhere `formatRelTime` would otherwise need re-renders |
| `UserMenu` | React component | Avatar trigger + dropdown with display name, "내 정보" link, "로그아웃". Renders "로그인" when `me` is null | Once in the app header (desktop + mobile) |
| `Avatar` | React component | Round profile picture; falls back to an initial letter on a token-colored circle | Stand-alone in lists, comments, etc. |
| `crossLocaleKeywords(dicts, getter)` | function | Build a cmdk `keywords` string that matches in ko AND en | Inline when defining items |
| `openCommandPalette()` | function | Dispatches the open event from anywhere | Custom triggers |
| `useGoToShortcuts` / `setTheme` / `getTheme` / `noFlashThemeScript` | helpers | Theme set/get + the `<head>` no-flash snippet for the `[data-theme]` dark convention | At/before first paint |

Helper-only entry (no React, safe for build-time / non-React runtimes):
`import { … } from "@etamong-lab/ui/helpers"` — re-exports
`crossLocaleKeywords`, `shortcutKey`, `noFlashThemeScript`, `getTheme`/`setTheme`,
`openCommandPalette`, `COMMAND_PALETTE_OPEN_EVENT`, `CODE_TO_KEY`.

## Where to mount the hosts (Next vs Vite)

`<Toaster />`, `<DialogHost />`, and `<CommandPalette />` use React state and
event listeners — they need to live in a **client component**.

- **Vite** — just drop them in `main.tsx`/`App.tsx` (the whole app is client).
- **Next.js** — server layouts can't render them directly. Make a tiny client
  wrapper and render *that* in `app/layout.tsx`:

  ```tsx
  // components/notifications.tsx
  "use client";
  import { Toaster, DialogHost } from "@etamong-lab/ui";
  export function Notifications() { return (<><Toaster /><DialogHost /></>); }
  ```

  Then `<Notifications />` in the server-rendered root layout.

The `CommandPaletteTrigger` and `useGoToShortcuts` likewise need a client
boundary (they listen for keydown / dispatch events).

## Install

Consumers resolve `@etamong-lab/*` from the group registry. In the app's
`.npmrc`:

```
@etamong-lab:registry=https://gitlab.com/api/v4/groups/126360447/-/packages/npm/
```

```sh
pnpm add @etamong-lab/ui
```

## Design tokens

Import once at the app root:

```ts
import "@etamong-lab/ui/styles.css";
```

The command palette is styled from **namespaced `--etu-*` tokens** (light
defaults on `:root`, dark under either `[data-theme="dark"]` or the `.dark`
class) — deliberately prefixed so this file is safe to import into any app,
including shadcn/Tailwind apps that already own `--accent`/`--border`/`--ring`.
To theme the palette to your app, map a few `--etu-*` vars onto your own tokens:

```css
/* shadcn app: */
:root, .dark {
  --etu-surface: var(--popover);
  --etu-border: var(--border);
  --etu-text: var(--popover-foreground);
  --etu-accent-soft: var(--accent);
}
```

For apps using the `[data-theme]` dark-mode convention, set the theme before
first paint to avoid a flash:

```ts
import { noFlashThemeScript } from "@etamong-lab/ui/helpers";
// Next: <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript("myapp") }} />
// Vite: inline the same string in index.html <head>.
```

`getTheme("myapp")` / `setTheme("myapp", "dark")` read and toggle it.

## Command palette

Mount once, globally, when authenticated:

```tsx
import { CommandPalette, crossLocaleKeywords } from "@etamong-lab/ui";
import { Home, Calendar } from "lucide-react";

const dicts = [ko, en];
const sections = [
  {
    id: "pages",
    heading: t.palette.pages,
    items: [
      { id: "home", label: t.nav.home, icon: <Home size={16} />, href: "/",
        keywords: crossLocaleKeywords(dicts, (d) => d.nav.home) },
      { id: "schedules", label: t.nav.schedules, icon: <Calendar size={16} />,
        href: "/schedules",
        keywords: crossLocaleKeywords(dicts, (d) => d.nav.schedules) },
    ],
  },
];

<CommandPalette sections={sections} isAdmin={isAdmin}
  onNavigate={(href) => router.push(href)}
  labels={{ placeholder: t.palette.placeholder, noResults: t.palette.noResults }} />
```

Opens on ⌘K / Ctrl+K, on `/` (unless typing), and on the
`command-palette:open` DOM event (`openCommandPalette()`). `adminOnly` items are
hidden unless `isAdmin`. Search filters on `keywords` — build them with
`crossLocaleKeywords` so ko/en both match. Icons are your nodes; the package
pins no icon library.

### Entities sections (load real content)

A nav-only palette returns "No results" when a user searches for their own
site/plan/vault by name. **Load the user's real objects** (sites, plans,
schedules, vaults) and add them as a data-driven section — each linking to its
detail route. This is part of the convention, not optional, for any app with a
list of named objects (see `concepts/command-palette`).

```tsx
const sections = useMemo(() => {
  const out: CommandSection[] = [navSection];
  if (sites.length) {
    out.push({
      id: "sites",
      heading: t.nav.sites,
      items: sites.map((s) => ({
        id: "site:" + s.slug, label: s.name, sublabel: s.slug,
        keywords: `${s.name} ${s.slug}`,
        onSelect: () => router.push(`/sites/${s.slug}`),
      })),
    });
  }
  return out;
}, [sites, t]);
```

### Search actions (catch-all "search for …" row)

`searchActions` is a bottom always-mounted group that receives the live query —
so an unmatched search still leads somewhere (a search/list route carrying the
text):

```tsx
const searchActions: CommandSearchAction[] = [
  { id: "search-all", label: t.palette.searchEverything,
    run: (q) => router.push(`/search?q=${encodeURIComponent(q)}`) },
];
<CommandPalette sections={sections} searchActions={searchActions} … />
```

## CommandPaletteTrigger

A token-styled "Search… ⌘K" search-box button — drop it in the sidebar or
header so users **discover** the palette. Clicking it dispatches
`command-palette:open`, no prop-drilling needed:

```tsx
import { CommandPaletteTrigger } from "@etamong-lab/ui";

<CommandPaletteTrigger label={t.palette.search} />
```

Shows a magnifier + the localized label + `⌘K` / `Ctrl+K` (auto-detected by
platform). The discoverable trigger is the difference between users finding the
palette vs. not — every multi-surface app should ship it.

## Go-to shortcuts

Two-key navigation (`g` then a letter), Korean-IME-safe:

```tsx
import { useGoToShortcuts } from "@etamong-lab/ui";

const pending = useGoToShortcuts(
  [{ key: "h", href: "/" }, { key: "s", href: "/schedules" },
   { key: "m", href: "/admin/members", adminOnly: true }],
  (href) => router.push(href),
  { isAdmin },
);
// render `pending` ("g" | null) as a small indicator
```

## Build

```sh
pnpm install
pnpm build      # tsup → dist (esm + cjs + d.ts), styles.css copied verbatim
pnpm typecheck
```

CI runs `pnpm typecheck` + `pnpm build` on every MR (see `.gitlab-ci.yml`).

## Notifications

Mount the hosts once at the app root (in Next, behind a `"use client"` wrapper):

```tsx
import { Toaster, DialogHost, toast, uiConfirm, uiPrompt, dismissToast } from "@etamong-lab/ui";

// app root (client boundary in Next):
//   <Toaster /> <DialogHost />

// Transient feedback — returns an id so you can dismiss early.
const id = toast("저장됐어요", "ok", 3000);     // kind: "ok" | "err" | "info"
dismissToast(id);

// Modal confirm — resolves boolean. `danger` styles the confirm red.
if (await uiConfirm({
  title: "삭제할까요?",
  body: "되돌릴 수 없어요.",
  confirmLabel: "삭제", cancelLabel: "취소", danger: true,
})) { /* … */ }

// Modal text prompt — resolves string | null (null on cancel).
const name = await uiPrompt({
  title: "이름",
  placeholder: "내 일정",
  defaultValue: "내 일정",
  confirmLabel: "만들기",
});
```

`uiConfirm` / `uiPrompt` are promise-based — drop-in replacements for
`window.confirm` / `window.prompt`. An app with its own local `(title, opts)`
helpers can keep them as thin adapters that delegate to these (see festplan's
`uiConfirm(title, opts)` adapter).

`<Toaster />` and `<DialogHost />` are **singleton hosts** — mount each exactly
once at the root. The functions (`toast`, `uiConfirm`, `uiPrompt`) talk to the
mounted host via a module-level pub/sub, so call them from anywhere.

## DeployInfo (build-version badge)

```tsx
import { DeployInfo } from "@etamong-lab/ui";

// In an "앱 정보 / App info" section of /settings (preferred) or the backoffice:
<section>
  <h2>{t.settings.appInfo}</h2>
  <DeployInfo
    version={import.meta.env.VITE_BUILD_SHA}    // Vite
    builtAt={import.meta.env.VITE_BUILD_TIME}
    label={t.settings.deployedAt}
  />
</section>
// Next: process.env.NEXT_PUBLIC_BUILD_SHA / _BUILD_TIME
```

Shows `deployed <sha> · <relative time>` (absolute timestamp in the tooltip);
renders **`null`** when neither value is set, so it's safe to mount
unconditionally — local dev shows nothing.

**Placement** — **settings → 앱 정보** if the app has a settings page; otherwise
the **backoffice / console**. Apps with neither (a small dashboard-only app like
minccino) get a small `/about` page linked from the account area. **Not a
global footer** — that was the first pass, reworked per user feedback. For
labeled rows (버전 / 배포 시각) instead of the compact badge, see the in-app
implementations (res-train `/settings`, festplan `#/settings`, pages admin
Access view). Baking the build env in CI: see `concepts/build-version-info`.

## InstallBanner (PWA install)

Mobile-only dismissable banner that does the right thing per platform:

```tsx
import { InstallBanner } from "@etamong-lab/ui";

// Once near the app root (same boundary as <Toaster />):
<InstallBanner
  label={t.install.hint}              // "홈 화면에 추가하면 더 빠르게!"
  iosHint={t.install.iosHint}         // "공유 → 홈 화면에 추가"
  installLabel={t.install.cta}        // "설치"
  storageKey="myapp-install-banner"   // per-app, to avoid clashes
/>
```

- **Chrome / Android** — captures `beforeinstallprompt`, shows an install
  button that fires the real native prompt.
- **iOS Safari** — no programmatic install. Shows a short
  "Share → Add to Home Screen" hint instead.
- **Already installed** (`display-mode: standalone`) — renders nothing.
- **Dismiss + cooldown** — clicking the close button hides the banner for 3
  days; gives up after 3 dismissals. Override with `cooldownMs` / `maxDismiss`.
- Hidden on `min-width: 768px`. For desktop, drop a small button using
  `useInstallPrompt()` instead.

This is the `concepts/spa-navigation-state` rule's PWA-install requirement
packaged once — apps drop the component in, no per-app
`beforeinstallprompt` / iOS-detection boilerplate to maintain.

```tsx
// Lower-level hook if you want to render your own UI:
const { canPrompt, promptInstall, isIOS, isStandalone } = useInstallPrompt();
```

## ErrorPage

Friendly full-page error surface. Pairs with the `httperr` `ref` pattern (see
`concepts/user-facing-error-messages`): show the clean message + the 8-hex
reference code, never the raw error / stack trace / repo path.

```tsx
import { ErrorPage } from "@etamong-lab/ui";

// Next.js error.tsx (per-route error boundary):
"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPage
      title="문제가 발생했어요"
      description="잠시 후 다시 시도해 주세요."
      refCode={error.digest}            // or whatever ref your backend returns
      onRetry={reset}
      onHome={() => location.assign("/")}
    />
  );
}
```

```tsx
// Vite + React Router 404 / catch-all:
<Route path="*" element={
  <ErrorPage
    title="페이지를 찾을 수 없어요"
    description="주소를 다시 확인해 주세요."
    onHome={() => navigate("/")}
  />
} />
```

Props:

- `title`, `description` — Korean defaults; override per-route.
- `refCode` — the 8-hex `ref` from your backend (`httperr` produces this).
  Shown discreetly under the actions so the user can quote it.
- `onRetry`, `onHome` — optional handlers. Render their buttons only when set.
- `labels` — override the `retry` / `home` / `refLabel` strings (defaults are
  Korean).
- `icon` — replace the default circle-alert glyph with your own node.

The component is token-styled (`--etu-*`), so it inherits the app's dark/light
theme automatically. It contains **no repo links**, no file paths, no stack
traces — by design (`concepts/no-repo-exposure`).

## useRouteState / useSessionState

Two hooks for the "F5 keeps me on this view, with the same tab/filter/sort
selected" half of the SPA navigation contract
(`concepts/spa-navigation-state`). Router-agnostic — they read and write
`window.history` directly, so they work with hash routers, path routers,
and apps without a router lib at all.

```tsx
import { useRouteState, useSessionState } from "@etamong-lab/ui";

// URL-backed: ends up in the query string (?tab=members), restores on
// refresh, syncs with browser back/forward.
const [tab, setTab] = useRouteState<"overview" | "deploys" | "members">("tab", "overview");

// Pretty URL — pass plain string codecs so the value isn't JSON-quoted:
const [tab2, setTab2] = useRouteState("tab", "overview", {
  serialize: (v) => v,
  deserialize: (raw) => raw as typeof tab,
});

// sessionStorage-backed: never enters the URL, scoped per route by default.
const [draft, setDraft] = useSessionState("draft", "");
const [scroll, setScroll] = useSessionState("scrollY", 0);
```

Both hooks have the same `[value, setValue]` shape as `useState`, including
the functional updater form (`setTab(prev => prev === "a" ? "b" : "a")`).

Options:

- **`serialize` / `deserialize`** — defaults to `JSON.stringify` /
  `JSON.parse`, so booleans, numbers, and arrays round-trip without extra
  work. Override for cleaner URLs.
- **`replace`** (`useRouteState` only) — defaults to `true`, so noisy state
  like search-as-you-type doesn't pile up in the back history. Set
  `replace: false` when each change *should* be a back-button stop.
- **`scope`** (`useSessionState` only) — overrides the default per-route
  scope (`pathname + hash`). Pass a static string for state that should
  span routes.

The hooks listen on `popstate` and `hashchange`, plus a private
`etu:route-state` event they fire after their own writes — so multiple
components reading the same key stay in sync.

SSR-safe: on the server they return the `initial` value; the URL/session
read happens on mount in an effect.

## useInAppBack / BackButton

The other half of the SPA navigation contract: the back button — both the
browser's and your in-UI one — should stay inside the app.

`useInAppBack` tracks an in-app history stack by writing a marker into
`history.state` on every in-app navigation. `canGoBack` is true when at
least one in-app entry sits behind the current one; `goBack()` calls
`history.back()` when true, otherwise it runs the optional `onExit`
fallback so cold-entry users (someone landed on a deep link from
outside) still go somewhere sensible.

```tsx
import { useInAppBack, BackButton } from "@etamong-lab/ui";

function App() {
  const back = useInAppBack({ onExit: () => (location.href = "/") });

  function openSite(slug: string) {
    back.push(`#/sites/${slug}`);   // grows the in-app stack
  }
  function changeTab(tab: string) {
    back.replace(`#/sites/foo/${tab}`);  // does NOT grow the stack
  }

  return (
    <>
      <BackButton canGoBack={back.canGoBack} goBack={back.goBack} />
      {/* …rest of the app */}
    </>
  );
}
```

Notes:

- The hook is router-agnostic — it reads and writes `window.history`
  directly. Wire it through your router's `push`/`replace` or use the
  hook's own `push`/`replace` helpers.
- Pairs cleanly with `useRouteState`, which uses `replaceState`. URL-
  synced in-page state (tab, filter) doesn't grow the back stack.
- The first mount marks the current entry as in-app at depth `0`, so any
  later `push()` has a baseline to count from. Browser back across a
  push restores the marker; a hard reload starts fresh from `0`
  (correct: the page IS the entry point).
- `<BackButton>` renders nothing when there's nowhere to go, unless
  `alwaysShow` or an `onClick` is set. Default label: "뒤로"; override
  via `label`.

## createFetch / HttpError

A small `fetch` wrapper that bakes in the etamong-lab house conventions:
the [httperr](../../../shared/libs/httperr) JSON shape (`{error, ref}`),
`oauth2-proxy` sign-in on 401, JSON in / JSON out by default.

```ts
import { createFetch, HttpError } from "@etamong-lab/ui";

export const api = createFetch({ baseUrl: "/api" });

// Then anywhere in the app:
const me = await api.get<{ email: string; is_admin: boolean }>("/me");
const created = await api.post<Site>("/sites", { name: "blog", visibility: "public" });
const list = await api.get<Site[]>("/sites", { query: { q: "blog" } });
```

On a non-2xx response, the wrapper throws an `HttpError` that carries the
server's `ref` code. Drop it into `<ErrorPage>`:

```tsx
try {
  await api.post("/sites", payload);
} catch (e) {
  if (e instanceof HttpError) {
    return <ErrorPage description={e.message} refCode={e.ref} onRetry={retry} />;
  }
  throw e;
}
```

Options:

- **`baseUrl`** — prepended to relative paths.
- **`onAuthError`** — called on 401. Default: redirects to
  `/oauth2/start?rd=<current url>` (the `oauth2-proxy` sign-in flow).
  Pass `() => {}` to disable.
- **`onError`** — fires for every non-2xx after the error is built but
  before it's thrown. Use for telemetry / global toast; doesn't suppress
  the throw.
- **`headers`** — static object or factory. Common case: an
  `Authorization` header for non-browser callers (CLI / cron).
- **`fetchImpl`** — override the global `fetch` (tests / SSR).

Per-call options on every method: `query` (object → query string),
`headers`, `signal` (AbortController), `raw: true` (return the raw
`Response` without JSON parsing — for downloads / streaming).

The wrapper:

- sets `Accept: application/json` and `credentials: "same-origin"` by
  default (works with cookie-based browser sessions);
- serializes plain-object bodies to JSON and sets `Content-Type:
  application/json`; passes `FormData` / `Blob` / strings through
  untouched;
- handles 204 / empty responses (resolves `undefined`);
- returns `Response` directly when `raw: true`.

## useMe + sign-in / sign-out helpers

Every etamong-lab app sits behind `oauth2-proxy` and exposes a small
`/me` endpoint with the authenticated identity. This hook + the URL
helpers cover the repeated wiring.

```tsx
import { useMe, signIn, signOut, type BaseMe } from "@etamong-lab/ui";

// App-specific shape — extends BaseMe ({ email, preferred_username?,
// is_admin?, roles? }).
interface Me extends BaseMe {
  can_create_apps?: boolean;
}

function Header() {
  const { me, loading, error } = useMe<Me>();
  if (loading) return null;
  if (error || !me) return <button onClick={() => signIn()}>로그인</button>;
  return (
    <div>
      {me.preferred_username ?? me.email}
      {me.is_admin && <span className="badge">관리자</span>}
      <button onClick={() => signOut("/")}>로그아웃</button>
    </div>
  );
}
```

Options:

- **`endpoint`** — default `/api/me`. Ignored when `fetcher` is set.
- **`fetcher`** — pass `() => api.get<Me>("/me")` when the app's API
  base path differs from the default, or to inherit `createFetch`'s
  error handling.
- **`treat401AsAnonymous`** — default `true`. 401 from the default
  fetcher resolves to `me: null, error: null`. Set `false` if your app
  considers an unauthenticated user a hard error. Ignored with a custom
  `fetcher`.

`refresh()` fires an `etu:me-refresh` event so multiple `useMe`
consumers re-fetch together (e.g. after a token-add flow flips
`can_create_apps`).

The URL helpers follow the oauth2-proxy convention:

- `signInUrl(rd?)` → `/oauth2/start?rd=<encoded>` (default `rd` = current URL).
- `signOutUrl(rd?)` → `/oauth2/sign_out?rd=<encoded>` (default `rd` = `/`).
- `signIn(rd?)` / `signOut(rd?)` navigate the browser to those URLs.

## EmptyState

The "nothing here yet" card. Every list / grid view has one; this is
the single one to use.

```tsx
import { EmptyState } from "@etamong-lab/ui";

<EmptyState
  title="아직 사이트가 없어요"
  description="새 사이트를 만들어 시작해 보세요."
  action={<button className="cta" onClick={onNew}>새 사이트</button>}
/>

// Compact variant for sidebar / inline use:
<EmptyState compact title="결과 없음" description="검색어를 바꿔 보세요." />
```

Props:

- `title` — required headline.
- `description` — optional one-line description (ReactNode).
- `action` — optional CTA / footnote node.
- `icon` — replace the default cube glyph; pass `null` to omit.
- `compact` — smaller padding + smaller type.

Marked `role="status"` for screen readers.

## CopyButton + useClipboard

For the secret-reveal / token-copy / slug-copy / ref-copy moments.
Pairs with the package's `toast()` for the "복사됨" confirmation, and
falls back to a hidden `<textarea>` + `document.execCommand("copy")`
when `navigator.clipboard` isn't available (non-https / older mobile).

```tsx
import { CopyButton, useClipboard } from "@etamong-lab/ui";

// Standard text button:
<CopyButton value={token} />

// Icon-only, sitting next to a value display:
<code>{slug}</code> <CopyButton value={slug} iconOnly />

// Custom UI — useClipboard returns the state machine:
function MyButton({ value }) {
  const { copied, copy } = useClipboard();
  return (
    <button onClick={() => copy(value)}>
      {copied ? "✓ 복사됨" : "복사"}
    </button>
  );
}
```

`<CopyButton>` props:

- `value` — required string to copy.
- `label` / `successLabel` — default `"복사"` / `"복사됨"`.
- `iconOnly` — render just the icon (default: icon + label).
- `icon` — override the default copy/check glyph; pass `null` to omit.
- `ariaLabel` — used when `iconOnly`; defaults to `label`.
- `resetMs` — how long the copied state lingers. Default `1500`.
- `toastOnSuccess` / `toastOnError` — toast text; pass `null` to suppress.

## Service worker (registration + online-first SW recipe)

Two pieces for the planning `concepts/pwa-service-worker` rule: a
registration helper for the app, and a generator for the SW file itself.
The preset is biased toward **online users see the latest build** — the
cache is only the offline safety net.

### registerServiceWorker

```ts
import { registerServiceWorker } from "@etamong-lab/ui";

const sw = registerServiceWorker("/sw.js", {
  // Default behavior: toast says "새 버전이 준비됐어요. 새로고침할까요?"
  // and the next nav uses the new SW. autoReloadOnUpdate: true skips the
  // prompt and reloads as soon as the new SW is ready.
});
```

What the helper does on top of `navigator.serviceWorker.register`:

- Calls `registration.update()` aggressively — on load, on
  `visibilitychange` → visible, and on a 2-minute interval — so a
  long-lived installed tab catches a new deploy without a manual reload.
- Listens for `controllerchange` and reloads the page **once** when the
  new SW takes over. `onActivate` fires right before the reload so the
  app can persist transient state.
- When a new SW finishes installing and is waiting, shows the "새 버전"
  toast. The waiting SW is activated when the user navigates / reloads,
  or you can call `sw.applyUpdate()` to do it programmatically.

Returns a handle: `{ registration, hasUpdate, applyUpdate,
checkForUpdate, unregister }`.

### networkFirstSwSource

Generates the SW file itself. Use it from a build step so the
`version` is the build SHA:

```ts
// build.mjs
import { networkFirstSwSource } from "@etamong-lab/ui";
import { writeFile } from "node:fs/promises";

const sha = process.env.BUILD_SHA ?? Date.now().toString(36);
await writeFile(
  "public/sw.js",
  networkFirstSwSource({
    version: sha,
    networkTimeoutMs: 3000,
    passThroughPrefixes: ["/oauth2/", "/sse/"],
  }),
);
```

What the recipe does:

- **Never intercepts** non-GET, cross-origin requests, or any URL whose
  path starts with `/api/` or one of `passThroughPrefixes`. Auth and
  live state always hit the network.
- **Navigations** (`request.mode === "navigate"`): network-first with
  `networkTimeoutMs` (default 3s). If the network wins, the response is
  cached + returned. If the network times out (offline / flaky), the
  cached copy is served.
- **Same-origin GET assets**: same network-first strategy — fresh wins
  online, cache covers offline.
- Caches are versioned (`etu-nav-<version>` / `etu-asset-<version>`); on
  `activate` everything else is deleted, then `clients.claim()`.
- `skipWaiting()` on install + a `SKIP_WAITING` message handler so
  `sw.applyUpdate()` can force the takeover.

When **not** to use the preset:

- The shortener single-segment-route family (`/{code}` reaches the
  apiserver, not the SPA) — keep the bespoke `navigateFallbackAllowlist`
  recipe in `concepts/pwa-service-worker`.
- Push-only SWs (schedule-manager) — no caching at all.
- Scoped stale-while-revalidate of specific safe-read endpoints
  (minccino) — narrower than this preset; keep the hand-rolled regex.

## Backoffice scaffold (AdminGate + AdminBadge + BackofficeLayout)

The admin-gate + 관리자 전용 badge + page-head layout every backoffice
route in the fleet re-implements. Pairs with `useMe<T>` — pass the `me`
straight through.

```tsx
import { useMe, AdminGate, BackofficeLayout } from "@etamong-lab/ui";

interface Me extends BaseMe { can_create_apps?: boolean }

function Console() {
  const { me } = useMe<Me>();
  return (
    <AdminGate
      me={me}
      emails={["root@etamong.com", "ops@etamong.com"]}
      predicate={(m) => m.can_create_apps === true}
      fallback={<div>권한이 없어요.</div>}
    >
      <BackofficeLayout
        title="앱 콘솔"
        description="앱 생성·배포·롤백을 관리합니다."
        actions={<button onClick={onNewApp}>새 앱</button>}
      >
        <AppList />
      </BackofficeLayout>
    </AdminGate>
  );
}
```

The gate is a **logical OR** across these signals:

- `me.is_admin === true` (always counts; no config needed).
- `emails` — case-insensitive allowlist; useful for the LLM
  prompt-audit consoles where the admin set isn't expressed in the IdP.
- `roles` — if `me.roles` intersects this set.
- `predicate(me)` — app-specific flag (`can_create_apps`, etc.).

If you need the boolean without the wrapping component:

```ts
import { isAdminLike } from "@etamong-lab/ui";
if (isAdminLike({ me, emails: ADMIN_EMAILS })) router.push("/admin");
```

`<BackofficeLayout>` renders the `<AdminBadge>` next to the title by
default. Pass `badge={null}` to hide it, or `badge={<CustomBadge />}` to
override.

## AppInfoSection (canonical "앱 정보" card)

The standing placement rule: app version and release time belong in
`/settings` or the backoffice "About" route, not in a page footer. This
component is the canonical layout — wraps `<DeployInfo>` so apps stop
hand-rolling that placement.

```tsx
import { AppInfoSection } from "@etamong-lab/ui";

<AppInfoSection
  name="schedule-manager"
  description="회의실 예약 관리 시스템"
  icon={<img src="/icon.svg" alt="" />}
  appVersion="1.4.2"
  version={BUILD_SHA}
  builtAt={BUILT_AT}
  links={[
    { label: "도움말", href: "/help" },
    { label: "이용약관", href: "/terms" },
    { label: "개인정보처리방침", href: "/privacy" },
  ]}
>
  {/* Free-form rows after the standard ones */}
  <div className="etu-app-info-row">
    <dt>Plan</dt>
    <dd>Pro</dd>
  </div>
</AppInfoSection>
```

Props:

- `name` / `description` / `icon` — identity block (top of the card).
- `appVersion` — the semver shown as the "버전" row (typically your
  `package.json` `version`).
- `version` / `builtAt` — forwarded to `<DeployInfo>` for the "빌드" row
  (shows `deployed <sha7> · <rel time>`).
- `links` — link row at the bottom; external URLs open in a new tab.
- `children` — free-form rows inside the `<dl>` — wrap each in a
  `<div className="etu-app-info-row">` for consistent two-column
  layout.
- `heading` — default `"앱 정보"`. Pass `null` to omit.

Both the identity block and the `<dl>` rows are conditional: if you
only pass `version`/`builtAt`, the card collapses to just the build
row.

## Time helpers (formatRelTime / formatAbsTime / RelTime)

The relative-time + KST-absolute formatting that used to live inside
`<DeployInfo>`, pulled out and shared. Apps stop reinventing
`"3분 전"` / KST conversion.

```tsx
import { formatRelTime, formatAbsTime, RelTime } from "@etamong-lab/ui";

formatRelTime("2026-06-13T03:29:00Z");
// → "3분 전" (when locale defaults to ko)

formatAbsTime("2026-06-13T03:29:00Z");
// → "2026. 06. 13. 12:29" (KST default)

formatAbsTime(Date.now(), { withZoneSuffix: true });
// → "2026. 06. 13. 12:34 KST"

// Self-refreshing relative label — `<time dateTime>` with the absolute
// time in the `title` so hover reveals the exact KST timestamp.
<RelTime when={item.createdAt} />
```

`formatRelTime` options:

- `locale` — defaults to the document/browser default. Pass `"ko"` /
  `"en"` to force.
- `numeric` — default `"auto"` (gives `"어제"` / `"yesterday"` instead
  of `"1 day ago"`).
- `now` — reference time for "now"; defaults to `Date.now()`.

`formatAbsTime` options:

- `timeZone` — default `"Asia/Seoul"`.
- `locale` — default `"ko-KR"`.
- `style` — preset (`"date"`, `"time"`, `"datetime"`,
  `"datetime-seconds"`); ignored when `formatOptions` is set.
- `formatOptions` — raw `Intl.DateTimeFormatOptions` for full control.
- `withZoneSuffix` — appends ` KST` (or the literal zone string for
  non-default zones).

`<RelTime>` refresh cadence is "auto": every 15 s under a minute, every
minute under an hour, every 10 minutes beyond. The title (absolute
time) stays in sync because it's derived in the same render.

Invalid timestamps (bad ISO, `undefined`) render to empty strings —
safe to use directly on partial data.

## UserMenu + Avatar

The fleet-wide profile-picture + "내 정보" link + 로그아웃 surface every
app's header should expose so users have one consistent place to find
themselves. Composes with `useMe<T>` (v0.10).

```tsx
import { useMe, UserMenu } from "@etamong-lab/ui";

interface Me extends BaseMe { /* picture / preferred_username / is_admin … */ }

function Header() {
  const { me } = useMe<Me>();
  return (
    <header className="app-header">
      {/* …logo, nav… */}
      <UserMenu me={me} myInfoHref="/me" />
    </header>
  );
}
```

The trigger is the avatar. Click → dropdown with:

- Display name (`me.name` ?? `me.preferred_username` ?? `me.email`).
- Email line (when distinct from the display name).
- `admin` pill when `me.is_admin` (suppress via `showAdminBadge={false}`).
- Optional `extraItems` rows above the standard ones.
- The "내 정보" link (set `myInfoHref={null}` to hide).
- The "로그아웃" button.

Escape and click-outside close it.

Anonymous (`me == null`) renders a "로그인" link pointing at
`signInUrl()`; pass `signedOutAction` to override.

Logout default is `signOut("/")` (oauth2-proxy `/oauth2/sign_out?rd=/`).
Apps with their own logout endpoint pass `onSignOut`:

```tsx
<UserMenu
  me={me}
  onSignOut={() => {
    void fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }}
/>
```

Apps wanting just the avatar (lists, comments, prompts) can use the
stand-alone `<Avatar>`:

```tsx
<Avatar src={comment.author.picture} fallback={comment.author.email} size={24} />
```

Pictures that fail to load fall back to the initial letter automatically.

## Releasing

The package publishes from CI **on a version tag** — no manual `pnpm publish`.

```sh
# 1. bump the version on a branch → MR → merge to main
#    (edit "version" in package.json, e.g. 0.4.0 → 0.5.0)
# 2. tag the merged commit and push the tag:
git checkout main && git pull
git tag v0.5.0           # the tag MUST equal package.json's version
git push origin v0.5.0
```

The tag pipeline verifies `vX.Y.Z` matches `package.json`, builds, and publishes
with `CI_JOB_TOKEN`. Versioning is **semver, but `0.x`**: cut **minor** bumps
(0.4 → 0.5) for new components/exports and **patch** (0.4.0 → 0.4.1) for fixes.
Re-tagging an already-published version fails loudly (npm won't overwrite).

## Consuming in an app

Four things are needed (or the app's CI 404s / fails to resolve the package):

1. **App `.npmrc`** — group registry:
   `@etamong-lab:registry=https://gitlab.com/api/v4/groups/126360447/-/packages/npm/`
2. **`package.json`** — `"@etamong-lab/ui": "^0.5.0"`.
3. **Dockerfile deps stage** — `ARG GITLAB_NPM_TOKEN` + before install:
   `RUN echo "//gitlab.com/api/v4/:_authToken=${GITLAB_NPM_TOKEN}" >> .npmrc`;
   the build job passes `--build-arg GITLAB_NPM_TOKEN=$CI_JOB_TOKEN`. (Node check
   jobs need the same `_authToken` line in `before_script`.)
4. **Job-token allowlist** — this project's inbound allowlist must include the
   consumer. Already granted for all 8 apps in
   `cloud-infra/gitlab-infra` (`ui_job_token.tf`, **numeric** ids). New apps: add
   there.

**Picking up a new release:** bump the pin in `package.json` **and** refresh the
lockfile, then commit both — the app CIs use `--frozen-lockfile`, so the lockfile
must move for the new version to install:

```sh
pnpm add @etamong-lab/ui@^0.5.0   # updates package.json + pnpm-lock.yaml
git add package.json pnpm-lock.yaml && git commit -m "bump @etamong-lab/ui to 0.5.0"
```

Note `^0.x` is narrow: `^0.4.0` = `>=0.4.0 <0.5.0`, so a **minor** bump needs the
pin changed in every consumer (a patch stays in range but still needs the
lockfile updated).
