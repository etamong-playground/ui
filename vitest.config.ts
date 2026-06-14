import { defineConfig } from "vitest/config";

// Component + hook tests run under jsdom. `globals` lets `describe/it/expect`
// be used without imports. Coverage is opt-in via `pnpm test -- --coverage`.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**"],
    },
  },
});
