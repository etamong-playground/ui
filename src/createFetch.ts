/**
 * Tiny `fetch` wrapper with the etamong-lab house conventions baked in:
 *
 *   - **httperr `ref` parsing** — non-2xx JSON bodies shaped like
 *     `{ error: string, ref: string }` (planning concepts/user-facing-
 *     error-messages, shared/libs/httperr) become an `HttpError` whose
 *     `ref` drops straight into `<ErrorPage refCode={err.ref}>`.
 *   - **OIDC sign-in on 401** — 401 responses trigger `onAuthError`,
 *     which by default redirects to `oauth2-proxy`'s sign-in flow with
 *     the current URL as `rd`.
 *   - **JSON in / JSON out by default** — request bodies that are plain
 *     objects get `Content-Type: application/json` + serialized; non-empty
 *     2xx responses with a JSON content type are parsed.
 *
 * Designed to be the one fetch wrapper an etamong-lab app needs.
 * Compose with route-state / error-page / toast on the consumer side.
 */

export interface CreateFetchOptions {
  /**
   * Base URL prepended to relative paths. `"/api"` (default: empty —
   * paths are used as-is).
   */
  baseUrl?: string;
  /**
   * Called on a 401 response. Default: redirect the browser to
   * `/oauth2/start?rd=<current url>`. Pass a no-op when the app handles
   * auth elsewhere (e.g. inside its router).
   */
  onAuthError?: () => void;
  /**
   * Called for every non-2xx response after the `HttpError` is built but
   * before it's thrown. Use for telemetry / global toast. Doesn't affect
   * the throw — the caller still gets the error.
   */
  onError?: (err: HttpError) => void;
  /**
   * Extra headers to add to every request. Static object or a function
   * (evaluated per request). Common use: an `Authorization` header for
   * token-based callers (not browser sessions).
   */
  headers?: HeadersInit | (() => HeadersInit);
  /**
   * Override the global `fetch` (for tests / SSR). Default: `globalThis.fetch`.
   */
  fetchImpl?: typeof fetch;
}

export interface HttpErrorBody {
  /** Server-supplied user-facing message. */
  error?: string;
  /** 8-hex correlation id from the server log (httperr). */
  ref?: string;
  /** Any extra fields the server included. */
  [extra: string]: unknown;
}

/**
 * Error thrown for every non-2xx response. The `ref` field is the join
 * key into the server-side error log and is what `<ErrorPage>` shows.
 */
export class HttpError extends Error {
  status: number;
  ref?: string;
  body?: HttpErrorBody | string;
  url: string;

  constructor(status: number, url: string, body: HttpErrorBody | string | undefined) {
    const msg =
      (typeof body === "object" && body?.error) ||
      `HTTP ${status}` + (typeof body === "object" && body?.ref ? ` (ref=${body.ref})` : "");
    super(msg);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
    this.body = body;
    if (typeof body === "object" && body?.ref) this.ref = body.ref;
  }
}

export interface RequestOptions {
  /** Query-string params; values are stringified. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Per-call header override (merged on top of the factory headers). */
  headers?: HeadersInit;
  /** Per-call body. Objects → JSON. `FormData` / `Blob` / strings pass through. */
  body?: unknown;
  /** Abort signal. */
  signal?: AbortSignal;
  /**
   * Skip JSON parsing and return the raw `Response` instead. Useful for
   * downloads / streaming.
   */
  raw?: boolean;
}

export interface FetchClient {
  request<T = unknown>(method: string, path: string, opts?: RequestOptions): Promise<T>;
  get<T = unknown>(path: string, opts?: RequestOptions): Promise<T>;
  post<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  put<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  delete<T = unknown>(path: string, opts?: RequestOptions): Promise<T>;
}

function defaultAuthRedirect() {
  if (typeof window === "undefined") return;
  const rd = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  window.location.href = "/oauth2/start?rd=" + rd;
}

function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
  let url = path;
  if (base && !/^https?:/.test(path)) url = base.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      params.set(k, String(v));
    }
    const q = params.toString();
    if (q) url += (url.includes("?") ? "&" : "?") + q;
  }
  return url;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

export function createFetch(opts: CreateFetchOptions = {}): FetchClient {
  const base = opts.baseUrl ?? "";
  const onAuthError = opts.onAuthError ?? defaultAuthRedirect;
  const onError = opts.onError;
  const fetchImpl = opts.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);

  async function request<T>(method: string, path: string, ro: RequestOptions = {}): Promise<T> {
    if (!fetchImpl) throw new Error("createFetch: no fetch impl available");
    const url = buildUrl(base, path, ro.query);

    const headers = new Headers();
    const factory = typeof opts.headers === "function" ? opts.headers() : opts.headers;
    if (factory) new Headers(factory).forEach((v, k) => headers.set(k, v));
    if (ro.headers) new Headers(ro.headers).forEach((v, k) => headers.set(k, v));

    let body: BodyInit | undefined;
    if (ro.body !== undefined && ro.body !== null) {
      if (isPlainObject(ro.body) || Array.isArray(ro.body)) {
        body = JSON.stringify(ro.body);
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      } else {
        body = ro.body as BodyInit;
      }
    }
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const res = await fetchImpl(url, { method, headers, body, signal: ro.signal, credentials: "same-origin" });

    if (res.status === 401) {
      onAuthError();
      // Still throw so the caller's promise chain doesn't continue with
      // a half-applied state during the redirect.
      const err = new HttpError(401, url, await safeParse(res));
      if (onError) onError(err);
      throw err;
    }

    if (!res.ok) {
      const parsed = await safeParse(res);
      const err = new HttpError(res.status, url, parsed);
      if (onError) onError(err);
      throw err;
    }

    if (ro.raw) return res as unknown as T;
    if (res.status === 204 || res.headers.get("Content-Length") === "0") {
      return undefined as T;
    }
    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  }

  return {
    request,
    get: <T>(p: string, o?: RequestOptions) => request<T>("GET", p, o),
    post: <T>(p: string, body?: unknown, o?: RequestOptions) =>
      request<T>("POST", p, { ...o, body }),
    put: <T>(p: string, body?: unknown, o?: RequestOptions) =>
      request<T>("PUT", p, { ...o, body }),
    patch: <T>(p: string, body?: unknown, o?: RequestOptions) =>
      request<T>("PATCH", p, { ...o, body }),
    delete: <T>(p: string, o?: RequestOptions) => request<T>("DELETE", p, o),
  };
}

async function safeParse(res: Response): Promise<HttpErrorBody | string | undefined> {
  try {
    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) return (await res.json()) as HttpErrorBody;
    const text = await res.text();
    return text || undefined;
  } catch {
    return undefined;
  }
}
