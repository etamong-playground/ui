/**
 * Barrel for `@etamong-playground/ui/testing` — fleet-wide test helpers.
 *
 *   - viewport-fit assertions (chrome primitive layout checks)
 *   - MSW handlers (`/me`, `/healthz`, httperr error shape)
 *   - Playwright fixtures (ko-KR + Asia/Seoul + canonical viewport)
 *
 * Apps import what they need; tree-shaking drops the rest.
 */

export * from "./testing-viewport-fit";
export * from "./testing-msw";
export * from "./testing-playwright";
