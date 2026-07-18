import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";

import { DialogHost, uiConfirm, uiPrompt } from "../src/dialog";

afterEach(() => {
  cleanup();
});

describe("DialogHost keyboard handling", () => {
  it("resolves uiConfirm as false on Escape (focus stays on the outside trigger)", async () => {
    render(<DialogHost />);
    let resolved: boolean | undefined;
    act(() => {
      void uiConfirm({ title: "Delete?" }).then((v) => (resolved = v));
    });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(resolved).toBe(false));
  });

  it("resolves uiConfirm as true on Enter", async () => {
    render(<DialogHost />);
    let resolved: boolean | undefined;
    act(() => {
      void uiConfirm({ title: "Confirm?" }).then((v) => (resolved = v));
    });
    fireEvent.keyDown(document, { key: "Enter" });
    await waitFor(() => expect(resolved).toBe(true));
  });

  it("resolves uiPrompt as null on Escape", async () => {
    render(<DialogHost />);
    let resolved: string | null | undefined;
    act(() => {
      void uiPrompt({ title: "Name?" }).then((v) => (resolved = v));
    });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(resolved).toBe(null));
  });
});
