/**
 * Playwright helpers for the fleet viewport-fit assertions.
 *
 * The chrome primitives (`<NavigationBar>` v0.28.1+, MobileTabBar/Sidebar
 * to follow) emit dev-mode `console.warn` lines prefixed with
 * `[@etamong-playground/ui]` when layout breaks (off-screen bar, shrunk title,
 * stacked safe-area-top). This module lifts the dev-mode signal into a
 * CI gate.
 *
 *   1. Apps add a Playwright spec that calls `assertViewportFit(page,
 *      urls)`.
 *   2. CI runs it at each fleet device profile (mobile/tablet/desktop +
 *      iPhone-Pro-PWA).
 *   3. Any `[@etamong-playground/ui]` warning fails the test with the original
 *      message — so the diagnosis is the same one the developer would
 *      have seen at localhost.
 *
 * Peer dependency: `@playwright/test` (peer, not bundled). Apps that
 * don't run e2e simply don't import this entry; nothing is pulled.
 *
 * See planning wiki: concepts/viewport-fit-assertions.md.
 */

import type {
  ConsoleMessage,
  Page,
  PlaywrightTestArgs,
  PlaywrightTestConfig,
} from "@playwright/test";

/** Marker the chrome primitives prefix every layout warning with. */
export const VIEWPORT_FIT_WARN_PREFIX = "[@etamong-playground/ui]";

/**
 * Canonical device profiles to drive viewport-fit checks at. These
 * cover the four corners the regression has historically slipped past:
 * iPhone Pro PWA (notch, narrow), iPad Mini (tablet rail boundary),
 * desktop (sidebar), small Android (mobile tab bar).
 *
 * Names match Playwright's `devices` map where possible so apps can
 * also reuse the profile directly.
 */
export interface DeviceProfile {
  name: string;
  viewport: { width: number; height: number };
  /** When true, set the page to standalone-display-mode for iOS PWA. */
  standalone?: boolean;
  /** Emulate notched device safe-area-insets via a meta tag patch. */
  safeAreaTop?: number;
  safeAreaBottom?: number;
}

export const FLEET_VIEWPORT_PROFILES: DeviceProfile[] = [
  {
    name: "iphone-17-pro-pwa",
    viewport: { width: 402, height: 874 },
    standalone: true,
    safeAreaTop: 59,
    safeAreaBottom: 34,
  },
  {
    name: "ipad-mini-portrait",
    viewport: { width: 768, height: 1024 },
  },
  {
    name: "desktop-1280",
    viewport: { width: 1280, height: 800 },
  },
  {
    name: "android-narrow",
    viewport: { width: 360, height: 780 },
  },
];

export interface AssertViewportFitOptions {
  /**
   * Profiles to iterate. Default: `FLEET_VIEWPORT_PROFILES`. Pass an
   * empty array to run only the currently-set page viewport.
   */
  profiles?: DeviceProfile[];
  /**
   * Extra time (ms) to settle after navigation before reading the
   * captured warnings. Default 400 — gives the primitive's two
   * `requestAnimationFrame` ticks plus a buffer for `env()` to apply.
   */
  settleMs?: number;
  /**
   * Additional console-message predicate. Default matches anything
   * starting with `[@etamong-playground/ui]`.
   */
  predicate?: (msg: ConsoleMessage) => boolean;
}

/**
 * Open each URL at each profile and assert no chrome primitive emitted
 * a `[@etamong-playground/ui]` warning. The first violation throws with the
 * original message — the failing test's stack carries the URL + profile.
 */
export async function assertViewportFit(
  page: Page,
  urls: string[],
  options: AssertViewportFitOptions = {},
): Promise<void> {
  const profiles =
    options.profiles && options.profiles.length
      ? options.profiles
      : FLEET_VIEWPORT_PROFILES;
  const settleMs = options.settleMs ?? 400;
  const predicate =
    options.predicate ??
    ((msg: ConsoleMessage) =>
      msg.type() === "warning" &&
      msg.text().startsWith(VIEWPORT_FIT_WARN_PREFIX));

  const collected: string[] = [];
  const onConsole = (msg: ConsoleMessage) => {
    if (predicate(msg)) collected.push(msg.text());
  };
  page.on("console", onConsole);

  try {
    for (const profile of profiles) {
      await page.setViewportSize(profile.viewport);
      if (profile.standalone) {
        await page.emulateMedia({ media: "screen", colorScheme: "no-preference" });
        await page.addInitScript(() => {
          // Trick `window.matchMedia('(display-mode: standalone)')` and
          // `navigator.standalone` for iOS PWA emulation.
          const origMatchMedia = window.matchMedia;
          window.matchMedia = (q: string) => {
            if (q.includes("display-mode: standalone")) {
              return {
                matches: true,
                media: q,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => true,
              } as MediaQueryList;
            }
            return origMatchMedia.call(window, q);
          };
          Object.defineProperty(navigator, "standalone", {
            configurable: true,
            value: true,
          });
        });
      }
      if (profile.safeAreaTop != null || profile.safeAreaBottom != null) {
        const top = profile.safeAreaTop ?? 0;
        const bot = profile.safeAreaBottom ?? 0;
        await page.addInitScript(
          (insets: { top: number; bot: number }) => {
            const style = document.createElement("style");
            style.textContent = `:root {
              --etu-test-safe-top: ${insets.top}px;
              --etu-test-safe-bot: ${insets.bot}px;
            }
            /* Stub env() so the browser sees a real inset value during
               headless testing. CSS @supports cannot polyfill env(), so
               apps that want this assertion to run under emulated
               notched insets must use the .etu-test-safe-top/bot custom
               properties instead of env() in tests — or apps can keep
               env() and accept that desktop Chromium reports 0.        */
          `;
            document.head.appendChild(style);
          },
          { top, bot },
        );
      }
      for (const url of urls) {
        collected.length = 0;
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(settleMs);
        if (collected.length > 0) {
          throw new Error(
            `viewport-fit assertion failed at ${profile.name} on ${url}:\n` +
              collected.map((l) => "  - " + l).join("\n"),
          );
        }
      }
    }
  } finally {
    page.off("console", onConsole);
  }
}

/**
 * Convenience: a Playwright test that wraps `assertViewportFit` and
 * fans out across profiles as separate test cases (so the failure
 * report names the profile). Apps wire this in their `tests/` dir as:
 *
 * ```ts
 * import { defineViewportFitTests } from "@etamong-playground/ui/testing";
 * defineViewportFitTests({
 *   urls: ["/", "/settings", "/me"],
 *   beforeEach: async ({ page }) => { /* auth, mocks */ /* },
 * });
 * ```
 */
export interface DefineViewportFitTestsOptions {
  urls: string[];
  profiles?: DeviceProfile[];
  /**
   * Optional per-test hook, run before the viewport-fit assertion. Receives
   * only `{ page }` — the helper's test callback destructures just the `page`
   * fixture (Playwright ≥ 1.38 statically requires object-destructuring of the
   * first arg to know which fixtures to inject). Seed identity/mocks via
   * `page.addInitScript` here.
   */
  beforeEach?: (args: { page: Page }) => Promise<void> | void;
  /** Optional title prefix. Default: "viewport-fit". */
  titlePrefix?: string;
}

export function defineViewportFitTests(
  // Pass `test` from your spec — we don't import it to avoid pulling
  // Playwright's runtime into apps that only use `assertViewportFit`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test: any,
  options: DefineViewportFitTestsOptions,
): void {
  const profiles =
    options.profiles && options.profiles.length
      ? options.profiles
      : FLEET_VIEWPORT_PROFILES;
  const prefix = options.titlePrefix ?? "viewport-fit";
  for (const profile of profiles) {
    // Destructure `{ page }` (not `args`): Playwright ≥ 1.38 rejects a
    // non-destructured first parameter ("First argument must use the object
    // destructuring pattern"). The helper only needs `page`.
    test(`${prefix} — ${profile.name}`, async ({ page }: PlaywrightTestArgs) => {
      if (options.beforeEach) await options.beforeEach({ page });
      await assertViewportFit(page, options.urls, {
        profiles: [profile],
      });
    });
  }
}

/** Type re-export so consumers don't have to depend directly on `@playwright/test` for the helper types. */
export type { Page, PlaywrightTestArgs, PlaywrightTestConfig };
