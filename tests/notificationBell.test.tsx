import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { NotificationBell } from "../src/notificationBell";
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

// planning#1133 review round — the row variant's trigger fell back to
// `aria-label={undefined}` when `badge === 0`, unlike the standalone
// trigger variant, which always falls back to `ariaLabel`. With badge 0 the
// common case, and the visible label hidden by CSS on a collapsed rail, the
// button had no accessible name at all.
describe("NotificationBell row variant — accessible name (fix E)", () => {
  it("falls back to the plain label when there are 0 unread", () => {
    render(<NotificationBell variant="row" label="알림함" items={[]} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("알림함");
  });

  it("folds the unread count into the label when > 0", () => {
    render(
      <NotificationBell
        variant="row"
        label="알림함"
        items={[
          { id: "1", content: "one" },
          { id: "2", content: "two" },
        ]}
      />,
    );
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("알림함 (2)");
  });

  it("falls back to ariaLabel when label is not a plain string", () => {
    render(
      <NotificationBell
        variant="row"
        label={<span>알림함</span>}
        ariaLabel="알림"
        items={[]}
      />,
    );
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("알림");
  });
});

// Fix J — the row trigger dropped the collapsed-rail `title` tooltip that
// the default `Item()` markup always sets.
describe("NotificationBell row variant — title tooltip (fix J)", () => {
  it("sets a title attribute matching the label", () => {
    render(<NotificationBell variant="row" label="알림함" items={[]} />);
    expect(screen.getByRole("button").getAttribute("title")).toBe("알림함");
  });
});

// planning#1140 — the `push` prop is opt-in; omitting it must leave the
// component byte-for-byte unchanged in behavior.
describe("NotificationBell — push prop is opt-in", () => {
  it("shows no setup dot and no enable row when push is omitted", () => {
    render(<NotificationBell items={[]} />);
    expect(document.querySelector(".etu-notif-bell-setup-dot")).toBeNull();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/알림을 받아보세요/)).toBeNull();
  });
});

describe("NotificationBell — push permission default", () => {
  it("shows the hollow setup dot on the trigger and the enable row at the top of the popover", () => {
    render(
      <NotificationBell
        items={[]}
        push={{ permission: permission({ state: "default" }) }}
      />,
    );
    expect(document.querySelector(".etu-notif-bell-setup-dot")).not.toBeNull();
    // The dot is purely visual (aria-hidden) — the trigger's accessible
    // name must carry the same signal for screen-reader users, mirroring
    // the existing unread-count treatment.
    const trigger = screen.getByRole("button", { name: /알림 — 알림 설정 가능/ });

    fireEvent.click(trigger);
    expect(screen.getByText(/알림을 받아보세요/)).not.toBeNull();
    // The row renders before the items list, not mixed into it.
    const popover = document.querySelector(".etu-notif-bell-popover");
    expect(popover).not.toBeNull();
    const rowIndex = Array.from(popover!.children).findIndex((c) =>
      c.className.includes("etu-push-row"),
    );
    const itemsIndex = Array.from(popover!.children).findIndex((c) =>
      c.className.includes("etu-notif-bell-items"),
    );
    expect(rowIndex).toBeGreaterThanOrEqual(0);
    expect(rowIndex).toBeLessThan(itemsIndex);
  });
});

// v0.48 (planning#1133 §6 correction) — the canonical `<Sidebar
// footerAccessory>` mount. Visually identical to the default trigger, but
// must portal its popover the same way `"row"` does, since the sidebar
// footer sits inside `<Sidebar>`'s own `overflow: auto` region.
describe("NotificationBell footer variant — trigger markup + portaled popover", () => {
  it("renders the standalone trigger markup, not the sidebar-item row markup", () => {
    render(<NotificationBell variant="footer" ariaLabel="알림" items={[]} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("etu-notif-bell-trigger");
    expect(button.className).not.toContain("etu-sidebar-item");
  });

  it("folds the unread count into the trigger's aria-label, same as the default trigger", () => {
    render(
      <NotificationBell
        variant="footer"
        ariaLabel="알림"
        items={[
          { id: "1", content: "one" },
          { id: "2", content: "two" },
        ]}
      />,
    );
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("알림 (2)");
  });

  it("opens a popover positioned via inline fixed-position style (portaled), not plain CSS-absolute", () => {
    render(<NotificationBell variant="footer" items={[]} />);
    fireEvent.click(screen.getByRole("button"));
    const popover = document.querySelector(".etu-notif-bell-popover") as HTMLElement;
    expect(popover).not.toBeNull();
    // The default `variant="trigger"` popover carries no inline `style`
    // attribute at all (pure CSS `position: absolute`); a portaled panel
    // always gets an inline style — either the pre-measurement placeholder
    // or the computed fixed coordinates — because it can't rely on a
    // `position: relative` ancestor.
    expect(popover.style.position).toBe("fixed");
  });
});

// Review round — mounting a non-portaling variant inside `<Sidebar
// footerAccessory>` silently clips the popover; nothing about that failure
// is visible until someone clicks and nothing happens. A dev-only warning
// makes the mismatch loud instead.
describe("NotificationBell — footerAccessory variant-mismatch dev warning", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns when the default trigger variant is mounted inside .etu-sidebar-footer-accessory", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "etu-sidebar-footer-accessory";
    document.body.appendChild(wrapper);
    render(<NotificationBell items={[]} />, { container: wrapper });
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('variant is not "footer"'),
    );
    wrapper.remove();
  });

  it("stays quiet when variant=\"footer\" is mounted inside .etu-sidebar-footer-accessory", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "etu-sidebar-footer-accessory";
    document.body.appendChild(wrapper);
    render(<NotificationBell variant="footer" items={[]} />, { container: wrapper });
    expect(console.warn).not.toHaveBeenCalled();
    wrapper.remove();
  });

  it("stays quiet for the default trigger variant outside a footerAccessory slot", () => {
    render(<NotificationBell items={[]} />);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe("NotificationBell — push permission granted", () => {
  it("shows no setup dot and no enable row (PushEnableRow renders null)", () => {
    render(
      <NotificationBell
        items={[]}
        push={{ permission: permission({ state: "granted", canPrompt: false }) }}
      />,
    );
    expect(document.querySelector(".etu-notif-bell-setup-dot")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "알림" }));
    expect(screen.queryByText(/알림을 받아보세요/)).toBeNull();
  });
});
