import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

import {
  isShareCrawler,
  SHARE_CRAWLER_UA_SUBSTRINGS,
  fleetLoginUrl,
  fleetLogoutUrl,
  LoginButton,
  LogoutButton,
  SessionBadge,
  SessionExpiredDialog,
  notifySessionExpired,
} from "../src/auth";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
});

describe("isShareCrawler", () => {
  it("matches every advertised crawler UA substring", () => {
    for (const needle of SHARE_CRAWLER_UA_SUBSTRINGS) {
      expect(isShareCrawler(`Foo/${needle}/1.0`)).toBe(true);
      expect(isShareCrawler(needle.toUpperCase())).toBe(true);
    }
  });

  it("returns false for browsers and empty input", () => {
    expect(isShareCrawler("Mozilla/5.0 Chrome/120")).toBe(false);
    expect(isShareCrawler("")).toBe(false);
    expect(isShareCrawler(null)).toBe(false);
    expect(isShareCrawler(undefined)).toBe(false);
  });
});

describe("fleetLoginUrl / fleetLogoutUrl", () => {
  it("encode rd query param", () => {
    expect(fleetLoginUrl("/foo?bar=1")).toBe(
      "/auth/login?rd=%2Ffoo%3Fbar%3D1",
    );
    expect(fleetLogoutUrl()).toBe("/auth/logout?rd=%2F");
  });

  it("defaults rd to current location for login", () => {
    window.history.replaceState(null, "", "/x/y?z=1");
    expect(fleetLoginUrl()).toBe("/auth/login?rd=%2Fx%2Fy%3Fz%3D1");
  });
});

describe("LoginButton / LogoutButton", () => {
  it("navigates to the fleet login URL on click", () => {
    const setter = vi.fn();
    Object.defineProperty(window, "location", {
      value: { href: "/" } as Location,
      writable: true,
    });
    Object.defineProperty(window.location, "href", {
      set: setter,
      get: () => "/",
    });
    render(<LoginButton rd="/dash" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(setter).toHaveBeenCalledWith("/auth/login?rd=%2Fdash");
  });

  it("renders custom label and forwards extra props", () => {
    render(<LogoutButton label="로그아웃" data-testid="lo" />);
    const btn = screen.getByTestId("lo");
    expect(btn.textContent).toBe("로그아웃");
    expect(btn.getAttribute("data-etu-auth")).toBe("logout");
  });
});

describe("SessionBadge", () => {
  it("renders nothing when not authenticated", () => {
    const { container } = render(<SessionBadge me={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the user pill when authenticated", () => {
    render(
      <SessionBadge
        me={{ email: "you@etamong.com", name: "You", picture: undefined }}
      />,
    );
    expect(screen.getByText("You")).toBeDefined();
  });
});

describe("SessionExpiredDialog", () => {
  it("opens on `etu:session-expired` event and exposes a sign-in CTA", () => {
    render(<SessionExpiredDialog />);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => notifySessionExpired());
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
  });
});
