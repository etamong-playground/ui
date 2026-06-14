# Changelog

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
