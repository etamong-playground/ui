import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { AuthGate } from "../src/auth";
import type { BaseMe } from "../src/useMe";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function pendingIdentity() {
  let resolve!: (value: BaseMe) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<BaseMe>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe("AuthGate identity options", () => {
  it("keeps the default same-origin identity endpoint", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ email: "default@example.test" }),
    });
    vi.stubGlobal("fetch", fetch);
    render(<AuthGate disableRedirect>Private tasks</AuthGate>);
    expect(await screen.findByText("Private tasks")).toBeDefined();
    expect(fetch).toHaveBeenCalledWith("/api/me", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
  });

  it("waits for the scoped fetcher without making an unscoped request", async () => {
    const identity = pendingIdentity();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const fetcher = () => identity.promise;
    render(
      <AuthGate identityOptions={{ fetcher }} loadingFallback="Checking account" disableRedirect>
        Scoped tasks
      </AuthGate>,
    );
    expect(screen.getByText("Checking account")).toBeDefined();
    expect(screen.queryByText("Scoped tasks")).toBeNull();
    await act(async () => identity.resolve({ email: "work@example.test" }));
    expect(screen.getByText("Scoped tasks")).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows a scoped failure without redirecting through generic sign-in", async () => {
    const originalLocation = Object.getOwnPropertyDescriptor(window, "location")!;
    const location = { href: "/tasks" };
    Object.defineProperty(window, "location", { configurable: true, value: location });
    try {
      const identity = pendingIdentity();
      render(
        <AuthGate identityOptions={{ fetcher: () => identity.promise }} loadingFallback="Checking" identityErrorFallback="Identity unavailable">
          Private tasks
        </AuthGate>,
      );
      await act(async () => identity.reject(new Error("Account unavailable")));
      expect(screen.queryByText("Checking")).toBeNull();
      expect(screen.queryByText("Private tasks")).toBeNull();
      expect(screen.getByText("Identity unavailable")).toBeDefined();
      expect(location.href).toBe("/tasks");
    } finally {
      Object.defineProperty(window, "location", originalLocation);
    }
  });

  it("redirects an explicitly anonymous scoped result to sign-in", async () => {
    const originalLocation = Object.getOwnPropertyDescriptor(window, "location")!;
    const location = { href: "/tasks" };
    Object.defineProperty(window, "location", { configurable: true, value: location });
    try {
      render(<AuthGate rd="/tasks" identityOptions={{ fetcher: async () => null }}>Private tasks</AuthGate>);
      await act(async () => {});
      expect(screen.queryByText("Private tasks")).toBeNull();
      expect(location.href).toBe("/auth/login?rd=%2Ftasks");
    } finally {
      Object.defineProperty(window, "location", originalLocation);
    }
  });

  it("keeps an anonymous default response outside the gate", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { container } = render(<AuthGate disableRedirect>Private tasks</AuthGate>);
    await act(async () => {});
    expect(container.textContent).toBe("");
  });

  it("does not let a late previous-account response unlock the selected account", async () => {
    const oldAccount = pendingIdentity();
    const selectedAccount = pendingIdentity();
    const { rerender } = render(
      <AuthGate key="old" identityOptions={{ fetcher: () => oldAccount.promise }} disableRedirect>
        Old tasks
      </AuthGate>,
    );
    rerender(
      <AuthGate key="selected" identityOptions={{ fetcher: () => selectedAccount.promise }} loadingFallback="Checking selected" disableRedirect>
        Selected tasks
      </AuthGate>,
    );
    await act(async () => oldAccount.resolve({ email: "old@example.test" }));
    expect(screen.getByText("Checking selected")).toBeDefined();
    expect(screen.queryByText("Selected tasks")).toBeNull();
    await act(async () => selectedAccount.resolve({ email: "selected@example.test" }));
    expect(screen.getByText("Selected tasks")).toBeDefined();
    expect(screen.queryByText("Old tasks")).toBeNull();
  });
});
