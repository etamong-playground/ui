import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PushEnableRow } from "../src/pushEnableRow";
import type { UsePushPermissionResult } from "../src/pushPermission";

afterEach(() => {
  cleanup();
});

function permission(overrides: Partial<UsePushPermissionResult>): UsePushPermissionResult {
  return {
    state: "default",
    supported: true,
    canPrompt: true,
    isBlocked: false,
    needsInstall: false,
    prompt: vi.fn().mockResolvedValue("default"),
    ...overrides,
  };
}

describe("PushEnableRow — unsupported", () => {
  it("renders nothing rather than a dead button", () => {
    const { container } = render(
      <PushEnableRow
        permission={permission({ state: "unsupported", supported: false, canPrompt: false })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("PushEnableRow — needs-install", () => {
  it("shows the install path, not a permission button", () => {
    render(
      <PushEnableRow
        permission={permission({ state: "needs-install", canPrompt: false, needsInstall: true })}
      />,
    );
    expect(screen.getByText(/홈 화면에 추가하면/)).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("PushEnableRow — denied", () => {
  it("explains re-enabling and never renders a button that would re-prompt", () => {
    render(
      <PushEnableRow
        permission={permission({ state: "denied", canPrompt: false, isBlocked: true })}
      />,
    );
    expect(screen.getByText(/알림이 차단되어 있어요/)).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("PushEnableRow — granted", () => {
  it("renders nothing by default", () => {
    const { container } = render(
      <PushEnableRow permission={permission({ state: "granted", canPrompt: false })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a quiet confirmation when showGrantedConfirmation is set, still no button", () => {
    render(
      <PushEnableRow
        permission={permission({ state: "granted", canPrompt: false })}
        showGrantedConfirmation
      />,
    );
    expect(screen.getByRole("status")).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("PushEnableRow — default (the enable affordance)", () => {
  it("calls prompt() on click and fires onEnabled when the result is granted", async () => {
    const prompt = vi.fn().mockResolvedValue("granted");
    const onEnabled = vi.fn();
    render(
      <PushEnableRow permission={permission({ state: "default", prompt })} onEnabled={onEnabled} />,
    );
    fireEvent.click(screen.getByRole("button"));
    await vi.waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(onEnabled).toHaveBeenCalledTimes(1));
  });

  it("does not call onEnabled when the user declines", async () => {
    const prompt = vi.fn().mockResolvedValue("denied");
    const onEnabled = vi.fn();
    render(
      <PushEnableRow permission={permission({ state: "default", prompt })} onEnabled={onEnabled} />,
    );
    fireEvent.click(screen.getByRole("button"));
    await vi.waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    expect(onEnabled).not.toHaveBeenCalled();
  });

  it("honors label overrides", () => {
    render(
      <PushEnableRow
        permission={permission({ state: "default" })}
        labels={{ enableCta: "커스텀 켜기" }}
      />,
    );
    expect(screen.getByRole("button", { name: "커스텀 켜기" })).not.toBeNull();
  });

  it("marks the button aria-disabled (not native disabled) while busy, so it stays focusable", async () => {
    let resolvePrompt: (v: "granted") => void;
    const prompt = vi.fn().mockReturnValue(
      new Promise<"granted">((resolve) => {
        resolvePrompt = resolve;
      }),
    );
    render(<PushEnableRow permission={permission({ state: "default", prompt })} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    await vi.waitFor(() => expect(button.getAttribute("aria-disabled")).toBe("true"));
    expect(button.getAttribute("aria-busy")).toBe("true");
    // Native `disabled` forces a blur the instant it applies — aria-disabled
    // keeps the element focusable/keyboard-operable during the async wait.
    expect(button.hasAttribute("disabled")).toBe(false);
    resolvePrompt!("granted");
    await vi.waitFor(() => expect(button.getAttribute("aria-disabled")).toBeNull());
  });

  it("ignores a second click while a prompt() call is already pending", async () => {
    let resolvePrompt: (v: "granted") => void;
    const prompt = vi.fn().mockReturnValue(
      new Promise<"granted">((resolve) => {
        resolvePrompt = resolve;
      }),
    );
    render(<PushEnableRow permission={permission({ state: "default", prompt })} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    resolvePrompt!("granted");
    await vi.waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  });
});
