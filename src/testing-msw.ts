/**
 * Cross-app MSW helpers. Optional — apps that use a different mock layer
 * don't pull `msw` in (it's a peer dep).
 *
 * Two contracts every etamong-lab webui shares:
 *
 *   1. `/me` from oauth2-proxy/Authentik returns `{email, is_admin, ...}`.
 *   2. Errors carry `{error, ref}` per `@etamong-lab/httperr`. Tests want a
 *      one-liner to produce a realistic failure.
 *
 * Both live here so a per-app `handlers.ts` only encodes the app's own
 * surface, not these standard shapes.
 */

import { http, HttpResponse, type HttpHandler } from "msw";

/** Random 8-hex ref, matching the httperr server-side format. */
export function mockHttperrRef(): string {
  const b = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(b);
  } else {
    for (let i = 0; i < 4; i++) b[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * httperr-shaped error body. Pass to `HttpResponse.json` with the desired
 * status so MSW returns the same shape as the real apiserver.
 */
export function httperrBody(message: string, ref?: string): { error: string; ref: string } {
  return { error: message, ref: ref ?? mockHttperrRef() };
}

export interface MockMe {
  email?: string;
  is_admin?: boolean;
  via_token?: boolean;
  can_create_apps?: boolean;
}

/**
 * `/me` handler at the standard fleet path. Pass any subset of fields; the
 * rest fall back to sensible test defaults.
 */
export function createMeHandler(me: MockMe = {}, path = "/api/v1/me"): HttpHandler {
  const body = {
    email: me.email ?? "you@etamong.com",
    is_admin: me.is_admin ?? false,
    via_token: me.via_token ?? false,
    can_create_apps: me.can_create_apps ?? false,
  };
  return http.get(path, () => HttpResponse.json(body));
}

/**
 * `/me` that returns the oauth2-proxy "not signed in" 401, so the webui's
 * sign-in flow renders.
 */
export function createMeSignedOutHandler(path = "/api/v1/me"): HttpHandler {
  return http.get(path, () =>
    HttpResponse.json(httperrBody("not signed in"), { status: 401 }),
  );
}

/**
 * Default healthz — every fleet apiserver exposes one and tests often hit it
 * in setup teardown.
 */
export function createHealthzHandler(path = "/healthz"): HttpHandler {
  return http.get(path, () => new HttpResponse("ok", { status: 200 }));
}

/**
 * Convenience bundle: `/me` (signed-in by default) + `/healthz`. The first
 * call site usually wants both; pass overrides as needed.
 */
export function defaultMockHandlers(
  me: MockMe = {},
  paths: { me?: string; healthz?: string } = {},
): HttpHandler[] {
  return [createMeHandler(me, paths.me), createHealthzHandler(paths.healthz)];
}
