/**
 * Playwright fixtures shared across fleet webui tests.
 *
 * - `fleetTest`: extends `@playwright/test` with `ko-KR` locale + UTC + a
 *   sensible default viewport that mirrors the chrome primitives' default
 *   breakpoint. Apps still pass `use: { ... }` overrides per project.
 * - Re-exports the device profiles already declared by `testing-viewport-fit`
 *   so apps writing non-viewport tests can still use the canonical profile
 *   names.
 *
 * `@playwright/test` is an optional peer — this file is tree-shaken away
 * when an app doesn't import it.
 */

import { test as base, type Page, type PlaywrightTestArgs } from "@playwright/test";

export { FLEET_VIEWPORT_PROFILES, type DeviceProfile } from "./testing-viewport-fit";

export interface FleetFixtures {
  /** Hook called once per test; passed the page after locale/viewport setup. */
  fleetPage: Page;
}

/**
 * Extended Playwright `test` that:
 *   - sets `Accept-Language: ko-KR` and locale ko-KR (matches the production
 *     i18n default per planning concept fleet-language-policy)
 *   - sets timezone to Asia/Seoul so date assertions are stable
 *   - sets a 1280×800 desktop viewport unless the test overrides it
 *
 * Use:
 *   import { fleetTest as test } from "@etamong-lab/ui/testing";
 *   test("works", async ({ page }) => { ... });
 */
export const fleetTest = base.extend<FleetFixtures>({
  // eslint-disable-next-line no-empty-pattern
  fleetPage: async ({ page }, use) => {
    await use(page);
  },
  page: async ({ browser }, use) => {
    const context = await browser.newContext({
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: { "Accept-Language": "ko-KR" },
    });
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      await page.close();
      await context.close();
    }
  },
});

/** Type re-exports so consumers don't need to import @playwright/test directly. */
export type { Page, PlaywrightTestArgs };
