import type { BaseMe } from "@etamong-playground/ui";

// Shared across App.tsx (live sidebar footer) and ChromeSection.tsx (UserMenu
// demo card) so both surfaces show the same demo identity.
export const mockMe: BaseMe = {
  email: "demo@example.com",
  preferred_username: "demo",
  name: "Demo User",
  is_admin: false,
};

export const mockAdmin: BaseMe = {
  email: "admin@example.com",
  preferred_username: "admin",
  name: "Admin User",
  is_admin: true,
};
