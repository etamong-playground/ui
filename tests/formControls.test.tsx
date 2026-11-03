import { createRef, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field, PasswordField, Select, TextField } from "../src/formControls";

afterEach(() => {
  cleanup();
  document.documentElement.lang = "en";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("native form controls", () => {
  it("wires a custom control to its label, requirements and descriptions", () => {
    render(
      <Field label="Notes" description="Public text" error="Enter a note" required>
        {(control) => <textarea {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement;
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")?.split(" ").map((id) => document.getElementById(id)?.textContent))
      .toEqual(["Public text", "Enter a note"]);
    expect((screen.getByText("Notes") as HTMLLabelElement).control).toBe(input);
  });

  it("retains explicit and generated IDs across errors and composes external descriptions", () => {
    const view = render(<><div id="extra">External help</div><TextField label="Name" description="Visible help" aria-describedby="extra" error="Enter a name" /></>);
    const input = screen.getByRole("textbox", { name: "Name" });
    const id = input.id;
    expect(id).not.toBe("");
    expect(input.getAttribute("aria-describedby")?.split(" ").map((id) => document.getElementById(id)?.textContent))
      .toEqual(["External help", "Visible help", "Enter a name"]);
    view.rerender(<><div id="extra">External help</div><TextField label="Name" description="Visible help" /></>);
    expect(input.id).toBe(id);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBe(`${id}-description`);
    expect(screen.queryByRole("alert")).toBeNull();
    view.rerender(<><div id="extra">External help</div><TextField id="chosen" label="Name" aria-invalid="grammar" /></>);
    expect(input.id).toBe("chosen");
    expect(input.getAttribute("aria-invalid")).toBe("grammar");
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });

  it("allocates distinct field IDs and renders numeric error content", () => {
    render(<><TextField label="First" /><TextField label="Second" error={0} /></>);
    expect(screen.getByLabelText("First").id).not.toBe(screen.getByLabelText("Second").id);
    expect(screen.getByRole("alert").textContent).toBe("0");
    expect(screen.getByLabelText("Second").getAttribute("aria-invalid")).toBe("true");
  });

  it("preserves native uncontrolled values, refs, validation and submitted names", () => {
    const ref = createRef<HTMLInputElement>();
    render(<form data-testid="form"><TextField ref={ref} label="Email" name="email" type="email" autoComplete="email" defaultValue="before@example.com" required /></form>);
    const input = screen.getByRole("textbox", { name: "Email" }) as HTMLInputElement;
    expect(ref.current).toBe(input);
    expect(input.value).toBe("before@example.com");
    expect(input.autocomplete).toBe("email");
    fireEvent.change(input, { target: { value: "after@example.com" } });
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("email")).toBe("after@example.com");
    fireEvent.change(input, { target: { value: "invalid" } });
    expect(input.validity.typeMismatch).toBe(true);
  });

  it("supports controlled text and select values through native change events", () => {
    function Example() {
      const [name, setName] = useState("");
      const [choice, setChoice] = useState("a");
      return <>
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <Select label="Choice" value={choice} onChange={(event) => setChoice(event.target.value)}>
          <option value="a">Alpha</option><option value="b">Beta</option>
        </Select>
        <output>{name}:{choice}</output>
      </>;
    }
    render(<Example />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Choice" }), { target: { value: "b" } });
    expect(screen.getByRole("status").textContent).toBe("Ada:b");
  });

  it("retains native multi-select behavior, disabled options and refs", () => {
    const ref = createRef<HTMLSelectElement>();
    render(<form data-testid="form"><Select ref={ref} label="Teams" name="teams" multiple size={3} defaultValue={["a", "c"]}>
      <option value="a">Alpha</option><option value="b" disabled>Beta</option><option value="c">Gamma</option>
    </Select></form>);
    const input = screen.getByRole("listbox", { name: "Teams" }) as HTMLSelectElement;
    expect(ref.current).toBe(input);
    expect(input.size).toBe(3);
    expect(input.options[1].disabled).toBe(true);
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).getAll("teams")).toEqual(["a", "c"]);
  });

  it("retains disabled and read-only semantics", () => {
    render(<form data-testid="form"><TextField label="Locked" name="locked" defaultValue="fixed" readOnly /><Select label="Disabled" name="disabled" disabled><option value="a">Alpha</option></Select></form>);
    expect((screen.getByLabelText("Locked") as HTMLInputElement).readOnly).toBe(true);
    expect((screen.getByLabelText("Disabled") as HTMLSelectElement).disabled).toBe(true);
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("disabled")).toBeNull();
  });

  it("toggles password visibility without changing its value, selection or form submission", () => {
    const ref = createRef<HTMLInputElement>();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submit}><PasswordField ref={ref} label="Password" name="password" defaultValue="example-value" autoComplete="current-password" locale="en" /></form>);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(ref.current).toBe(input);
    input.focus();
    input.setSelectionRange(2, 6, "backward");
    const toggle = screen.getByRole("button", { name: "Show password" });
    fireEvent.mouseDown(toggle);
    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(input.value).toBe("example-value");
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(6);
    expect(input.selectionDirection).toBe("backward");
    expect(document.activeElement).toBe(input);
    expect(toggle.getAttribute("aria-controls")).toBe(input.id);
    expect(input.autocomplete).toBe("current-password");
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input.type).toBe("password");
    expect(input.value).toBe("example-value");
  });

  it("supports Korean defaults, locale changes and explicit visibility labels", () => {
    document.documentElement.lang = "ko";
    const view = render(<PasswordField label="Password" />);
    expect(screen.getByRole("button", { name: "비밀번호 보기" })).toBeTruthy();
    view.rerender(<PasswordField label="Password" locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    view.rerender(<PasswordField label="Password" labels={{ hide: "Mask value" }} />);
    expect(screen.getByRole("button", { name: "Mask value" })).toBeTruthy();
  });

  it("disables password visibility changes with a disabled input", () => {
    render(<PasswordField label="Password" defaultValue="fixed" disabled locale="en" />);
    const toggle = screen.getByRole("button", { name: "Show password" }) as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
    fireEvent.click(toggle);
    expect((screen.getByLabelText("Password") as HTMLInputElement).type).toBe("password");
  });

  it("does not overwrite a newer caret position during deferred restoration", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frames.push(callback); return frames.length; });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    render(<PasswordField label="Password" defaultValue="example-value" locale="en" />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    input.setSelectionRange(2, 6);
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    input.setSelectionRange(8, 8);
    act(() => { frames.forEach((callback) => callback(0)); });
    expect(input.selectionStart).toBe(8);
    expect(input.selectionEnd).toBe(8);
  });

  it("hydrates document-language defaults without replacing the server-rendered control", async () => {
    const realDocument = document;
    const recover = vi.fn();
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let markup: string;
    try {
      vi.stubGlobal("document", undefined);
      markup = renderToString(<PasswordField label="Password" />);
    } finally {
      vi.stubGlobal("document", realDocument);
    }
    document.documentElement.lang = "ko";
    const container = document.createElement("div");
    container.innerHTML = markup!;
    document.body.append(container);
    const originalInput = container.querySelector("input");
    let root: Root | undefined;
    try {
      await act(async () => { root = hydrateRoot(container, <PasswordField label="Password" />, { onRecoverableError: recover }); });
      expect(recover).not.toHaveBeenCalled();
      expect(container.querySelector("input")).toBe(originalInput);
      expect(screen.getByRole("button", { name: "비밀번호 보기" })).toBeTruthy();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      errors.mockRestore();
    }
  });
});
