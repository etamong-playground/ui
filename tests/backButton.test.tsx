import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { BackButton } from "../src/backButton";
import { useInAppBack } from "../src/useInAppBack";
import { renderHook, act } from "@testing-library/react";

// Reset history + DOM between cases so etuDepth / etuInApp marker state
// from one test doesn't leak into the next.
beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
});

describe("BackButton — canonical one-liner (v0.27.0)", () => {
  it("renders when only `fallback` is provided (cold entry)", () => {
    render(<BackButton fallback="/more" />);
    expect(screen.getByRole("button", { name: "뒤로" })).toBeDefined();
  });

  it("calls a function-shaped fallback on click when there's no in-app history", () => {
    const fallback = vi.fn();
    render(<BackButton fallback={fallback} />);
    fireEvent.click(screen.getByRole("button"));
    expect(fallback).toHaveBeenCalledOnce();
  });

  it("navigates via pushState + popstate for a string-shaped fallback", () => {
    const onPopstate = vi.fn();
    window.addEventListener("popstate", onPopstate);
    render(<BackButton fallback="/more" />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.location.pathname).toBe("/more");
    expect(onPopstate).toHaveBeenCalledOnce();
    window.removeEventListener("popstate", onPopstate);
  });

  it("returns null when neither canGoBack, fallback, nor onClick is set", () => {
    const { container } = render(<BackButton />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with alwaysShow even without any handler wiring", () => {
    render(<BackButton alwaysShow />);
    expect(screen.getByRole("button")).toBeDefined();
  });
});

describe("BackButton — explicit prop wiring (back-compat)", () => {
  it("uses provided `goBack` over the internal hook when caller plumbs the pair", () => {
    const goBack = vi.fn();
    render(<BackButton canGoBack goBack={goBack} />);
    fireEvent.click(screen.getByRole("button"));
    expect(goBack).toHaveBeenCalledOnce();
  });

  it("prefers `onClick` over `goBack`", () => {
    const goBack = vi.fn();
    const onClick = vi.fn();
    render(<BackButton canGoBack goBack={goBack} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
    expect(goBack).not.toHaveBeenCalled();
  });
});

describe("useInAppBack — fallback option (v0.27.0)", () => {
  it("calls a function fallback when canGoBack is false", () => {
    const fallback = vi.fn();
    const { result } = renderHook(() => useInAppBack({ fallback }));
    expect(result.current.canGoBack).toBe(false);
    act(() => result.current.goBack());
    expect(fallback).toHaveBeenCalledOnce();
  });

  it("pushes a string fallback URL when canGoBack is false", () => {
    const { result } = renderHook(() => useInAppBack({ fallback: "/more" }));
    act(() => result.current.goBack());
    expect(window.location.pathname).toBe("/more");
  });

  it("falls back to `onExit` when `fallback` is undefined (back-compat)", () => {
    const onExit = vi.fn();
    const { result } = renderHook(() => useInAppBack({ onExit }));
    act(() => result.current.goBack());
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("prefers `fallback` over `onExit` when both are set", () => {
    const fallback = vi.fn();
    const onExit = vi.fn();
    const { result } = renderHook(() =>
      useInAppBack({ fallback, onExit }),
    );
    act(() => result.current.goBack());
    expect(fallback).toHaveBeenCalledOnce();
    expect(onExit).not.toHaveBeenCalled();
  });

  it("uses history.back() when in-app depth is positive (ignores fallback)", () => {
    const fallback = vi.fn();
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const { result } = renderHook(() => useInAppBack({ fallback }));
    act(() => result.current.push("/more/settings"));
    expect(result.current.canGoBack).toBe(true);
    act(() => result.current.goBack());
    expect(back).toHaveBeenCalledOnce();
    expect(fallback).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
