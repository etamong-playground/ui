# Changelog

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
