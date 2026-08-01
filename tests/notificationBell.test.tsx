import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { NotificationBell } from "../src/notificationBell";

afterEach(() => {
  cleanup();
});

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
