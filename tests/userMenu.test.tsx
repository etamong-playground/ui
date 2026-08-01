import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { UserMenu } from "../src/userMenu";
import type { BaseMe } from "../src/useMe";

afterEach(() => {
  cleanup();
});

const me: BaseMe = { email: "user@example.com", name: "테스트 사용자" };

// planning#1133 review round — the dropdown now renders through a portal to
// <body> (fix B, clipped by `<Sidebar>`'s `overflow-y: auto` otherwise).
// Portaling moves the dropdown out of the trigger's DOM subtree, so the
// click-outside handler needs to treat clicks inside the portaled panel as
// "inside" too, or the menu would close itself on every click.
describe("UserMenu dropdown — portal + click-outside (fix B)", () => {
  it("renders the dropdown outside the component's own root via a portal", async () => {
    render(<UserMenu me={me} />);
    fireEvent.click(screen.getByRole("button"));

    const dropdown = await screen.findByRole("menu");
    expect(dropdown.closest(".etu-user-menu")).toBeNull();
    expect(document.body.contains(dropdown)).toBe(true);
  });

  it("does not close when clicking inside the portaled dropdown", async () => {
    render(<UserMenu me={me} />);
    fireEvent.click(screen.getByRole("button"));

    const dropdown = await screen.findByRole("menu");
    fireEvent.mouseDown(dropdown);
    expect(screen.queryByRole("menu")).not.toBeNull();
  });

  it("closes when clicking outside both the trigger and the portaled dropdown", async () => {
    render(<UserMenu me={me} />);
    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("menu");

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
