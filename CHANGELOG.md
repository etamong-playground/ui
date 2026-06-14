# Changelog

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
