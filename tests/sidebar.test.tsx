import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { Sidebar, type SidebarItem, type SidebarSecondarySection } from "../src/sidebar";

afterEach(() => {
  cleanup();
});

// planning#1133 review round — `aria-label={strLabel}` unconditionally
// overrode ALL descendant text per the accessible-name algorithm, so the
// visible `.etu-sidebar-item-badge` pill was never announced, expanded or
// collapsed.
describe("Sidebar item badge — accessible name (fix A)", () => {
  it("folds a numeric badge into the item's aria-label", () => {
    const primary: SidebarItem[] = [
      { id: "inbox", label: "받은편지함", badge: 3, onClick: () => {} },
    ];
    render(<Sidebar primary={primary} />);
    expect(
      screen.getByRole("button", { name: /받은편지함/ }).getAttribute("aria-label"),
    ).toBe("받은편지함 (3)");
  });

  it("folds a string badge into the item's aria-label", () => {
    const primary: SidebarItem[] = [
      { id: "inbox", label: "받은편지함", badge: "N", onClick: () => {} },
    ];
    render(<Sidebar primary={primary} />);
    expect(
      screen.getByRole("button", { name: /받은편지함/ }).getAttribute("aria-label"),
    ).toBe("받은편지함 (N)");
  });

  it("marks the visible badge pill aria-hidden once folded into the label", () => {
    const primary: SidebarItem[] = [
      { id: "inbox", label: "받은편지함", badge: 3, onClick: () => {} },
    ];
    const { container } = render(<Sidebar primary={primary} />);
    const pill = container.querySelector(".etu-sidebar-item-badge");
    expect(pill?.getAttribute("aria-hidden")).toBe("true");
  });

  it("falls back to the plain label for a non-stringifying badge node instead of '[object Object]'", () => {
    const primary: SidebarItem[] = [
      {
        id: "inbox",
        label: "받은편지함",
        badge: <span>●</span>,
        onClick: () => {},
      },
    ];
    render(<Sidebar primary={primary} />);
    const button = screen.getByRole("button", { name: /받은편지함/ });
    const ariaLabel = button.getAttribute("aria-label");
    expect(ariaLabel).toBe("받은편지함");
    expect(ariaLabel).not.toMatch(/object/i);
  });
});

// Fix G — collapsed captions were only visually hidden (`font-size: 0`),
// not reliably removed from the accessibility tree.
describe("Sidebar secondary caption — aria-hidden (fix G)", () => {
  it("hides a string caption from the accessibility tree (the nav's aria-label already carries it)", () => {
    const sections: SidebarSecondarySection[] = [
      { id: "ops", caption: "OPERATE", items: [{ id: "a", label: "A", onClick: () => {} }] },
    ];
    const { container } = render(
      <Sidebar primary={[]} secondarySections={sections} />,
    );
    const caption = container.querySelector(".etu-sidebar-section-caption");
    expect(caption?.getAttribute("aria-hidden")).toBe("true");
    const nav = container.querySelector(".etu-sidebar-section--secondary");
    expect(nav?.getAttribute("aria-label")).toBe("OPERATE");
  });

  it("keeps a non-string caption exposed — it's the only accessible route to that text", () => {
    const sections: SidebarSecondarySection[] = [
      {
        id: "ops",
        caption: <span>OPERATE</span>,
        items: [{ id: "a", label: "A", onClick: () => {} }],
      },
    ];
    const { container } = render(
      <Sidebar primary={[]} secondarySections={sections} />,
    );
    const caption = container.querySelector(".etu-sidebar-section-caption");
    expect(caption?.getAttribute("aria-hidden")).toBeNull();
  });
});

// Fix L — `render` silently ignores every other field; warn in dev instead
// of a silent no-op, mirroring the existing secondary/secondarySections warning.
describe("Sidebar item render + ignored fields — dev warning (fix L)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns when render is combined with href/onClick/active/badge", () => {
    const primary: SidebarItem[] = [
      {
        id: "custom",
        onClick: () => {},
        render: () => <button type="button">custom</button>,
      },
    ];
    render(<Sidebar primary={primary} />);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("`render`"));
  });

  it("stays quiet when render is the only field set besides id", () => {
    const primary: SidebarItem[] = [
      { id: "custom", render: () => <button type="button">custom</button> },
    ];
    render(<Sidebar primary={primary} />);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
