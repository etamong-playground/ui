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
import { Toaster, DialogHost, toast, uiConfirm, uiPrompt } from "@etamong-lab/ui";

// app root: <Toaster /> <DialogHost />

toast("저장됐어요", "ok");                       // kind: "ok" | "err" | "info"
if (await uiConfirm({ title: "삭제할까요?", danger: true })) { /* … */ }
const name = await uiPrompt({ title: "이름", defaultValue: "내 일정" });
```

`uiConfirm`/`uiPrompt` are promise-based (replace native `confirm`/`prompt`).
An app with its own local `(title, opts)` helpers can keep them as thin adapters
that delegate to these (see festplan).

## DeployInfo (build-version badge)

```tsx
import { DeployInfo } from "@etamong-lab/ui";
<DeployInfo version={import.meta.env.VITE_BUILD_SHA}    // Vite
            builtAt={import.meta.env.VITE_BUILD_TIME} />
// Next: process.env.NEXT_PUBLIC_BUILD_SHA / _BUILD_TIME
```

Shows `deployed <sha> · <relative time>` (absolute in the tooltip); renders
`null` when neither is set. **Placement:** an "앱 정보 / App info" section in
settings (or the backoffice) — not a global footer. See
`concepts/build-version-info` for baking the build env in CI.

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
