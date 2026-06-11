# @etamong-lab/ui

Shared frontend scaffold for etamong-lab apps. v0.1 ships the design-token
contract and the command palette; notification primitives (toast, dialog,
sanitized markdown) follow in v0.2. Conventions: see the planning wiki
(`concepts/frontend-conventions`, `concepts/design-system`,
`concepts/command-palette`).

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
