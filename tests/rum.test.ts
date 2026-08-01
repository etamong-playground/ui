import { beforeEach, describe, expect, it, vi } from "vitest";

const pushEvent = vi.fn();
const getWebInstrumentations = vi.fn((_opts?: unknown) => []);
const initializeFaro = vi.fn(
  (_cfg: Record<string, unknown>): { api: { pushEvent: typeof pushEvent } } | undefined => ({
    api: { pushEvent },
  }),
);

vi.mock("@grafana/faro-web-sdk", () => ({
  initializeFaro,
  getWebInstrumentations,
  faro: { api: { pushEvent } },
}));

// initRum keeps module-level init state, so each test group re-imports a
// fresh module instance.
async function freshRum() {
  vi.resetModules();
  return import("../src/rum");
}

beforeEach(() => {
  pushEvent.mockClear();
  getWebInstrumentations.mockClear();
  initializeFaro.mockClear();
  initializeFaro.mockReturnValue({ api: { pushEvent } });
});

describe("initRum", () => {
  it("initializes faro with the fleet policy baked in", async () => {
    const { initRum } = await freshRum();
    initRum({ app: "meloetta", version: "abc1234", apiKey: "k" });

    expect(initializeFaro).toHaveBeenCalledTimes(1);
    const cfg = initializeFaro.mock.calls[0]![0];
    expect(cfg.url).toBe("https://faro.m.etamong.com/collect");
    expect(cfg.apiKey).toBe("k");
    expect(cfg.app).toEqual({ name: "meloetta", version: "abc1234" });
    expect(cfg.sessionTracking).toEqual({ samplingRate: 1 });
    // Unbatched: a discarded PWA tab must not lose its lifecycle breadcrumbs.
    expect(cfg.batching).toEqual({ enabled: false });
    // Console capture off (no-PII policy).
    expect(getWebInstrumentations).toHaveBeenCalledWith({ captureConsole: false });
  });

  it("strips the query string from meta.page.url via beforeSend", async () => {
    const { initRum } = await freshRum();
    initRum({ app: "a", apiKey: "k" });
    const cfg = initializeFaro.mock.calls[0]![0] as {
      beforeSend: (i: unknown) => unknown;
    };
    const item = { meta: { page: { url: "https://x.m/reset?token=secret&email=u@e.com" } } };
    const out = cfg.beforeSend(item) as typeof item;
    expect(out.meta.page.url).toBe("https://x.m/reset");
  });

  it("is idempotent", async () => {
    const { initRum } = await freshRum();
    initRum({ app: "a", apiKey: "k" });
    initRum({ app: "a", apiKey: "k" });
    expect(initializeFaro).toHaveBeenCalledTimes(1);
  });

  it("honors endpoint and sampling overrides", async () => {
    const { initRum } = await freshRum();
    initRum({ app: "a", apiKey: "k", endpoint: "https://x/collect", sessionSampleRate: 0.5 });
    const cfg = initializeFaro.mock.calls[0]![0];
    expect(cfg.url).toBe("https://x/collect");
    expect(cfg.sessionTracking).toEqual({ samplingRate: 0.5 });
  });

  it("does not wire listeners or mark initialized when init returns undefined", async () => {
    // The SDK returns undefined when a Faro instance is already registered
    // (e.g. an HMR re-eval): we must not close over an undefined instance.
    initializeFaro.mockReturnValueOnce(undefined);
    const { initRum, pushApiError } = await freshRum();
    initRum({ app: "a", apiKey: "k" });

    // initRum returned before marking initialized or wiring listeners, so
    // pushApiError stays a no-op. (Can't assert via a dispatched DOM event:
    // jsdom listeners from earlier initRum calls in this file persist across
    // module resets and would fire the shared mock.)
    pushApiError(new Error("boom"));
    expect(pushEvent).not.toHaveBeenCalled();
  });

  it("never throws out of app boot even if the SDK throws", async () => {
    initializeFaro.mockImplementationOnce(() => {
      throw new Error("sdk exploded");
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { initRum } = await freshRum();
    expect(() => initRum({ app: "a", apiKey: "k" })).not.toThrow();
    errSpy.mockRestore();
  });

  it("pushes lifecycle breadcrumbs on pagehide/visibilitychange", async () => {
    const { initRum } = await freshRum();
    initRum({ app: "a", apiKey: "k" });

    window.dispatchEvent(new Event("pagehide"));
    expect(pushEvent).toHaveBeenCalledWith("page_lifecycle", { state: "pagehide" });

    document.dispatchEvent(new Event("visibilitychange"));
    expect(pushEvent).toHaveBeenCalledWith("page_lifecycle", {
      state: document.visibilityState,
    });
  });
});

describe("pushApiError", () => {
  it("no-ops before initRum", async () => {
    const { pushApiError } = await freshRum();
    pushApiError(new Error("boom"));
    expect(pushEvent).not.toHaveBeenCalled();
  });

  it("extracts ref/status from HttpError-shaped errors and strips the query string", async () => {
    const { initRum, pushApiError } = await freshRum();
    initRum({ app: "a", apiKey: "k" });
    pushEvent.mockClear();

    // Shaped like createFetch's HttpError but a distinct class on purpose:
    // subpath bundles hold separate copies, so detection must not rely on
    // instanceof. The URL carries a token that must NOT reach Loki.
    const err = Object.assign(new Error("HTTP 401 (ref=3f9a1c0b)"), {
      name: "HttpError",
      ref: "3f9a1c0b",
      status: 401,
      url: "/auth/verify?token=secret&email=user@example.com",
    });
    pushApiError(err);

    expect(pushEvent).toHaveBeenCalledWith("api_error", {
      ref: "3f9a1c0b",
      status: "401",
      url: "/auth/verify",
      message: "HTTP 401 (ref=3f9a1c0b)",
    });
  });

  it("reports plain errors without ref attributes", async () => {
    const { initRum, pushApiError } = await freshRum();
    initRum({ app: "a", apiKey: "k" });
    pushEvent.mockClear();

    pushApiError(new TypeError("fetch failed"));
    expect(pushEvent).toHaveBeenCalledWith("api_error", { message: "fetch failed" });
  });
});
