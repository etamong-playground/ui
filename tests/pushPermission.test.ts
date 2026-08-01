import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { usePushPermission } from "../src/pushPermission";

// Web Push isn't implemented in jsdom, so every piece — Notification,
// PushManager, navigator.serviceWorker, the iOS UA sniff, and the
// display-mode media query — has to be stubbed by hand per test.

function stubPushApis(permission: NotificationPermission = "default") {
  const requestPermission = vi.fn().mockResolvedValue(permission);
  vi.stubGlobal("Notification", { permission, requestPermission });
  vi.stubGlobal("PushManager", class {});
  Object.defineProperty(navigator, "serviceWorker", {
    value: {},
    configurable: true,
  });
  return requestPermission;
}

function clearPushApis() {
  vi.unstubAllGlobals();
  if ("serviceWorker" in navigator) delete (navigator as unknown as Record<string, unknown>).serviceWorker;
}

function stubUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });
}

function stubStandalone(standalone: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("display-mode: standalone") ? standalone : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const DESKTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

afterEach(() => {
  clearPushApis();
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "userAgent", { value: DESKTOP_UA, configurable: true });
});

describe("usePushPermission — unsupported", () => {
  it("renders unsupported when Notification/PushManager/serviceWorker are absent", async () => {
    stubUserAgent(DESKTOP_UA);
    stubStandalone(false);
    // No stubPushApis() call — the environment has none of the required APIs.
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.supported).toBe(false));
    expect(result.current.state).toBe("unsupported");
    expect(result.current.canPrompt).toBe(false);
    expect(result.current.needsInstall).toBe(false);
    expect(result.current.isBlocked).toBe(false);
  });

  it("prompt() is a no-op and reports unsupported", async () => {
    stubUserAgent(DESKTOP_UA);
    stubStandalone(false);
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("unsupported"));
    const outcome = await act(() => result.current.prompt());
    expect(outcome).toBe("unsupported");
  });
});

describe("usePushPermission — iOS not standalone", () => {
  it("yields needs-install rather than default, even though the platform supports push", async () => {
    stubPushApis("default");
    stubUserAgent(IOS_UA);
    stubStandalone(false);
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("needs-install"));
    expect(result.current.needsInstall).toBe(true);
    expect(result.current.canPrompt).toBe(false);
    expect(result.current.supported).toBe(true);
  });

  it("prompt() never calls Notification.requestPermission while needs-install", async () => {
    const requestPermission = stubPushApis("default");
    stubUserAgent(IOS_UA);
    stubStandalone(false);
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("needs-install"));
    const outcome = await act(() => result.current.prompt());
    expect(outcome).toBe("needs-install");
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("iOS + standalone resolves the real Notification.permission instead", async () => {
    stubPushApis("default");
    stubUserAgent(IOS_UA);
    stubStandalone(true);
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("default"));
    expect(result.current.needsInstall).toBe(false);
    expect(result.current.canPrompt).toBe(true);
  });

  it("prompt() called before the initial effect settles still resolves needs-install, never default", async () => {
    // Regression: usePushPermission used to derive isIOS/isStandalone from
    // useInstallPrompt()'s own returned state, which only resolves inside
    // *that* hook's effect — one render later than this hook's own first
    // effect pass. A caller invoking prompt() in that window used to see a
    // stale "default" read and could call the native API on an iOS device
    // that can't actually support it yet. prompt() now re-derives iOS/
    // standalone directly on every call, so this must hold even
    // synchronously, before any `waitFor`.
    const requestPermission = stubPushApis("default");
    stubUserAgent(IOS_UA);
    stubStandalone(false);
    const { result } = renderHook(() => usePushPermission());
    const outcome = await act(() => result.current.prompt());
    expect(outcome).toBe("needs-install");
    expect(requestPermission).not.toHaveBeenCalled();
  });
});

describe("usePushPermission — denied never re-prompts", () => {
  it("starts denied and prompt() resolves without calling the native API", async () => {
    const requestPermission = stubPushApis("denied");
    stubUserAgent(DESKTOP_UA);
    stubStandalone(false);
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("denied"));
    expect(result.current.isBlocked).toBe(true);
    expect(result.current.canPrompt).toBe(false);

    const outcome = await act(() => result.current.prompt());
    expect(outcome).toBe("denied");
    expect(requestPermission).not.toHaveBeenCalled();
    // Calling prompt() repeatedly must stay a no-op — the platform will
    // never re-prompt after a denial, so the hook must never loop it.
    await act(() => result.current.prompt());
    await act(() => result.current.prompt());
    expect(requestPermission).not.toHaveBeenCalled();
    expect(result.current.state).toBe("denied");
  });
});

describe("usePushPermission — default → granted", () => {
  it("prompt() calls Notification.requestPermission and updates state on grant", async () => {
    const requestPermission = stubPushApis("default");
    stubUserAgent(DESKTOP_UA);
    stubStandalone(false);
    (requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue("granted");
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("default"));
    expect(result.current.canPrompt).toBe(true);

    const outcome = await act(() => result.current.prompt());
    expect(outcome).toBe("granted");
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe("granted");
    expect(result.current.canPrompt).toBe(false);
  });

  it("prompt() reflects a user decline without looping", async () => {
    const requestPermission = stubPushApis("default");
    stubUserAgent(DESKTOP_UA);
    stubStandalone(false);
    (requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue("denied");
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("default"));

    const outcome = await act(() => result.current.prompt());
    expect(outcome).toBe("denied");
    expect(result.current.state).toBe("denied");
    expect(result.current.isBlocked).toBe(true);
  });

  it("a second concurrent prompt() call reuses the in-flight request instead of re-invoking the native API", async () => {
    let resolveRequest: (v: NotificationPermission) => void;
    const requestPermission = vi.fn().mockReturnValue(
      new Promise<NotificationPermission>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    vi.stubGlobal("PushManager", class {});
    Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });
    stubUserAgent(DESKTOP_UA);
    stubStandalone(false);
    const { result } = renderHook(() => usePushPermission());
    await waitFor(() => expect(result.current.state).toBe("default"));

    const first = result.current.prompt();
    const second = result.current.prompt();
    resolveRequest!("granted");
    const [firstOutcome, secondOutcome] = await act(() => Promise.all([first, second]));
    expect(firstOutcome).toBe("granted");
    expect(secondOutcome).toBe("granted");
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });
});
