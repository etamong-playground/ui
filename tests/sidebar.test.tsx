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

// v0.48 (planning#1133 §6 correction) — `footerAccessory` is the canonical
// mount for the notification bell, rendered beside `footer` inside one
// `.etu-sidebar-footer` region rather than a separate block.
// jsdom's default `window.innerWidth` (1024) lands on the desktop tier,
// which is why the "expanded" tests below need no extra setup, while the
// "collapsed" tests override `innerWidth` before rendering — `useViewport`
// reads it synchronously on first render, so no `matchMedia` polyfill is
// needed for a single static render.
function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
}

const ORIGINAL_INNER_WIDTH = window.innerWidth;

describe("Sidebar footerAccessory", () => {
  afterEach(() => {
    setViewportWidth(ORIGINAL_INNER_WIDTH);
  });

  function footerChildOrder(footerEl: Element) {
    const children = Array.from(footerEl.children);
    const accessoryIndex = children.findIndex((c) => c.classList.contains("etu-sidebar-footer-accessory"));
    const identityIndex = children.findIndex(
      (c) => c.querySelector('[data-testid="identity"]') || c.getAttribute("data-testid") === "identity",
    );
    return { accessoryIndex, identityIndex };
  }

  it("wraps the accessory in .etu-sidebar-footer-accessory", () => {
    const { container } = render(
      <Sidebar
        primary={[]}
        footer={<span data-testid="identity">identity</span>}
        footerAccessory={<button type="button" data-testid="bell">bell</button>}
      />,
    );
    const footerEl = container.querySelector(".etu-sidebar-footer");
    expect(footerEl).not.toBeNull();
    const accessoryEl = footerEl!.querySelector(".etu-sidebar-footer-accessory");
    expect(accessoryEl).not.toBeNull();
    expect(accessoryEl!.querySelector('[data-testid="bell"]')).not.toBeNull();
  });

  // planning#1133 §6 review round (tab-order regression) — DOM order must
  // track the VISIBLE order in each state, not diverge via a CSS-only
  // reorder trick (the original implementation used `flex-direction:
  // row-reverse` and left DOM order accessory-first always, which put the
  // bell ahead of identity in tab order even while it rendered trailing).
  it("expanded (desktop): identity precedes the bell in DOM order, matching the visible trailing-icon layout", () => {
    setViewportWidth(1280);
    const { container } = render(
      <Sidebar
        primary={[]}
        tabletMode="rail"
        footer={<span data-testid="identity">identity</span>}
        footerAccessory={<button type="button" data-testid="bell">bell</button>}
      />,
    );
    const footerEl = container.querySelector(".etu-sidebar-footer")!;
    const { accessoryIndex, identityIndex } = footerChildOrder(footerEl);
    expect(identityIndex).toBeGreaterThanOrEqual(0);
    expect(accessoryIndex).toBeGreaterThan(identityIndex);
  });

  it("collapsed rail (tablet width): the bell precedes identity in DOM order, matching the visible above-the-avatar layout", () => {
    setViewportWidth(800);
    const { container } = render(
      <Sidebar
        primary={[]}
        tabletMode="rail"
        footer={<span data-testid="identity">identity</span>}
        footerAccessory={<button type="button" data-testid="bell">bell</button>}
      />,
    );
    const footerEl = container.querySelector(".etu-sidebar-footer")!;
    const { accessoryIndex, identityIndex } = footerChildOrder(footerEl);
    expect(identityIndex).toBeGreaterThanOrEqual(0);
    expect(accessoryIndex).toBeLessThan(identityIndex);
  });

  it("renders no footer region when neither footer nor footerAccessory is passed", () => {
    const { container } = render(<Sidebar primary={[]} />);
    expect(container.querySelector(".etu-sidebar-footer")).toBeNull();
  });

  it("still renders the footer region for footerAccessory alone, with no footer", () => {
    const { container } = render(
      <Sidebar
        primary={[]}
        footerAccessory={<button type="button" data-testid="bell">bell</button>}
      />,
    );
    const footerEl = container.querySelector(".etu-sidebar-footer");
    expect(footerEl).not.toBeNull();
    expect(footerEl!.querySelector('[data-testid="bell"]')).not.toBeNull();
  });

  // Review round — a generic `> *:not(.etu-sidebar-footer-accessory)` child
  // selector would match EVERY top-level node of a multi-node `footer`
  // value individually and smear each one sideways into the flex row
  // alongside the bell, since `SidebarProps.footer` is documented to accept
  // more than one top-level node (identity + Logout + inline DeployInfo).
  it("wraps a multi-node footer in a single .etu-sidebar-footer-identity when footerAccessory is present", () => {
    const { container } = render(
      <Sidebar
        primary={[]}
        footer={
          <>
            <span data-testid="identity">identity</span>
            <button type="button" data-testid="logout">logout</button>
          </>
        }
        footerAccessory={<button type="button" data-testid="bell">bell</button>}
      />,
    );
    const footerEl = container.querySelector(".etu-sidebar-footer")!;
    const identityWrap = footerEl.querySelector(".etu-sidebar-footer-identity");
    expect(identityWrap).not.toBeNull();
    expect(identityWrap!.querySelector('[data-testid="identity"]')).not.toBeNull();
    expect(identityWrap!.querySelector('[data-testid="logout"]')).not.toBeNull();
    // Exactly two direct children of the footer: the wrapper and the
    // accessory — not four individually-flexed nodes.
    expect(footerEl.children.length).toBe(2);
  });

  // No accessory: `footer` renders completely unwrapped, byte-for-byte as
  // before this change — the wrapper only exists to fix the flex layout
  // once an accessory is actually in play.
  it("renders footer unwrapped (no .etu-sidebar-footer-identity) when footerAccessory is absent", () => {
    const { container } = render(
      <Sidebar
        primary={[]}
        footer={<span data-testid="identity">identity</span>}
      />,
    );
    const footerEl = container.querySelector(".etu-sidebar-footer")!;
    expect(footerEl.querySelector(".etu-sidebar-footer-identity")).toBeNull();
    expect(footerEl.querySelector('[data-testid="identity"]')).not.toBeNull();
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
