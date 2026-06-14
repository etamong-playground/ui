# Changelog

## 0.24.0

- `<Sidebar>` accepts `secondarySections: { id?, caption?, items }[]` for
  captioned secondary subgroups (large-app shape). The existing
  `secondary: SidebarItem[]` stays for small apps; when both are passed
  `secondarySections` wins. Adds `.etu-sidebar-section-caption` styles
  and exports the `SidebarSecondarySection` type.
