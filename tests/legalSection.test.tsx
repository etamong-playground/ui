import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import {
  LEGAL_HUB_BASE_URL,
  LegalMenuItem,
  LegalPage,
  useLegalAvailability,
} from "../src/legalSection";
import { renderHook, act } from "@testing-library/react";

const MANIFEST_URL = "https://legal.example.test/api/public-manifest";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

function mockManifest(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = init;
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      statusText: ok ? "OK" : "Error",
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("useLegalAvailability", () => {
  it("returns the published kinds for the app in fixed order (terms before privacy)", async () => {
    mockManifest({
      services: {
        "alert-ops": { privacy: true, terms: true, identity: true },
      },
    });
    const { result } = renderHook(() =>
      useLegalAvailability("alert-ops", { manifestUrl: MANIFEST_URL }),
    );
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.kinds).toEqual(["terms", "privacy"]);
  });

  it("returns an empty kinds list when the app is absent from the manifest", async () => {
    mockManifest({ services: { "other-app": { terms: true, identity: true } } });
    const { result } = renderHook(() =>
      useLegalAvailability("alert-ops", { manifestUrl: MANIFEST_URL }),
    );
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.kinds).toEqual([]);
  });

  it("strips the `identity` slot from the L2 kinds (L1 row is always rendered separately)", async () => {
    mockManifest({
      services: { "alert-ops": { privacy: true, identity: true } },
    });
    const { result } = renderHook(() =>
      useLegalAvailability("alert-ops", { manifestUrl: MANIFEST_URL }),
    );
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.kinds).toEqual(["privacy"]);
  });

  it("on fetch failure: status becomes error, kinds stays empty", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() =>
      useLegalAvailability("alert-ops", { manifestUrl: MANIFEST_URL }),
    );
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.kinds).toEqual([]);
  });

  it("on second mount within the soft TTL, serves cached value without re-fetching", async () => {
    const fetchSpy = mockManifest({
      services: { "alert-ops": { terms: true, identity: true } },
    });
    const first = renderHook(() =>
      useLegalAvailability("alert-ops", { manifestUrl: MANIFEST_URL }),
    );
    await waitFor(() => expect(first.result.current.status).toBe("loaded"));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const second = renderHook(() =>
      useLegalAvailability("alert-ops", { manifestUrl: MANIFEST_URL }),
    );
    // Cached: status starts at "loaded", and no new fetch happens.
    expect(second.result.current.status).toBe("loaded");
    expect(second.result.current.kinds).toEqual(["terms"]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("refresh() forces a re-fetch even within the soft TTL", async () => {
    const fetchSpy = mockManifest({
      services: { "alert-ops": { terms: true, identity: true } },
    });
    const { result } = renderHook(() =>
      useLegalAvailability("alert-ops", { manifestUrl: MANIFEST_URL }),
    );
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    act(() => result.current.refresh());
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });
});

describe("<LegalMenuItem>", () => {
  it("renders an unconditional row with the default label and chevron", () => {
    render(<LegalMenuItem appSlug="alert-ops" />);
    const link = screen.getByRole("link", { name: /법률 정보/ });
    expect(link.getAttribute("href")).toBe("/more/legal");
    // In-app navigation = `›` chevron, not `↗`.
    expect(link.textContent).toContain("›");
    expect(link.textContent).not.toContain("↗");
  });

  it("calls onNavigate instead of doing a full-page nav when provided", () => {
    const onNavigate = vi.fn();
    render(<LegalMenuItem appSlug="alert-ops" to="/custom/legal" onNavigate={onNavigate} />);
    const link = screen.getByRole("link", { name: /법률 정보/ });
    link.click();
    expect(onNavigate).toHaveBeenCalledWith("/custom/legal");
  });

  it("renders just the row — the enclosing card class is the caller's responsibility", () => {
    const { container } = render(<LegalMenuItem appSlug="alert-ops" />);
    // No `.etu-legal-card` wrapper: the component is composable inside the app's own card.
    expect(container.querySelector(".etu-legal-card")).toBeNull();
    expect(container.querySelector(".etu-legal-row")).not.toBeNull();
  });

  it("draws a top divider by default (suppressed when isFirst is set)", () => {
    const { container, rerender } = render(<LegalMenuItem appSlug="alert-ops" />);
    expect(container.querySelector(".etu-legal-row--divided")).not.toBeNull();
    rerender(<LegalMenuItem appSlug="alert-ops" isFirst />);
    expect(container.querySelector(".etu-legal-row--divided")).toBeNull();
  });
});

describe("<LegalPage>", () => {
  it("renders one external row per published L2 kind + the always-present L1 identity row", async () => {
    mockManifest({
      services: { "alert-ops": { terms: true, privacy: true, identity: true } },
    });
    render(<LegalPage appSlug="alert-ops" manifestUrl={MANIFEST_URL} />);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /이용약관/ })).toBeDefined();
    });
    const terms = screen.getByRole("link", { name: /이용약관/ });
    const privacy = screen.getByRole("link", { name: /개인정보처리방침/ });
    const identity = screen.getByRole("link", { name: /로그인 정책/ });
    expect(terms.getAttribute("href")).toBe(`${LEGAL_HUB_BASE_URL}/#alert-ops-terms`);
    expect(privacy.getAttribute("href")).toBe(`${LEGAL_HUB_BASE_URL}/#alert-ops-privacy`);
    expect(identity.getAttribute("href")).toBe(`${LEGAL_HUB_BASE_URL}/#identity`);
    for (const a of [terms, privacy, identity]) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("shows the empty-state line when the manifest reports no L2 kinds for the app", async () => {
    mockManifest({ services: {} });
    render(<LegalPage appSlug="alert-ops" manifestUrl={MANIFEST_URL} />);
    await waitFor(() => {
      expect(screen.getByText("현재 등록된 법률 문서가 없습니다.")).toBeDefined();
    });
    // L1 still present.
    expect(screen.getByRole("link", { name: /로그인 정책/ })).toBeDefined();
  });

  it("does NOT show the empty-state line while loading — only after a successful fetch returns nothing", () => {
    // Fetch that never resolves keeps status at "loading".
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));
    render(<LegalPage appSlug="alert-ops" manifestUrl={MANIFEST_URL} />);
    expect(screen.queryByText("현재 등록된 법률 문서가 없습니다.")).toBeNull();
    // L1 still present even during the indeterminate state.
    expect(screen.getByRole("link", { name: /로그인 정책/ })).toBeDefined();
  });
});
