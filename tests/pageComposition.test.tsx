import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PageContainer, PageHeader, SettingsGroup, SettingsRow } from "../src/pageComposition";

describe("page composition", () => {
  it("renders every supported measure and header density", () => {
    for (const measure of ["narrow", "regular", "wide"] as const) {
      const { container, unmount } = render(<PageContainer as="div" measure={measure} />);
      expect(container.firstElementChild?.classList.contains(`etu-page-container--${measure}`)).toBe(true);
      unmount();
    }

    for (const density of ["compact", "regular"] as const) {
      const { container, unmount } = render(<PageHeader density={density} headingLevel={2} title={density} />);
      expect(container.firstElementChild?.classList.contains(`etu-page-header--${density}`)).toBe(true);
      expect(screen.getByRole("heading", { level: 2, name: density })).toBeTruthy();
      unmount();
    }
  });

  it("exposes the selected measure and compact header hierarchy", () => {
    const { container } = render(
      <PageContainer measure="narrow">
        <PageHeader
          density="compact"
          kicker="개인 설정"
          title="설정"
          description="계정과 앱 정보를 관리합니다."
          actions={<button type="button">저장</button>}
        />
      </PageContainer>,
    );

    expect(container.querySelector("main")?.classList.contains("etu-page-container--narrow")).toBe(true);
    expect(screen.getByRole("heading", { level: 1, name: "설정" }).classList.contains("etu-page-header-title")).toBe(true);
    expect(screen.getByText("개인 설정").classList.contains("etu-page-header-kicker")).toBe(true);
    expect(screen.getByRole("button", { name: "저장" }).parentElement?.classList.contains("etu-page-header-actions")).toBe(true);
  });

  it("groups setting rows and associates controls with their copy", () => {
    render(
      <SettingsGroup heading="계정" description="되돌리기 어려운 작업입니다." tone="danger">
        <SettingsRow
          label="계정 삭제"
          description="삭제 요청 후 30일 동안 취소할 수 있습니다."
          action={(accessibility) => <select defaultValue="request" {...accessibility}><option value="request">삭제 요청</option></select>}
        />
      </SettingsGroup>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "계정" }).closest("section")?.classList.contains("etu-settings-group--danger")).toBe(true);
    expect(screen.getByText("계정 삭제").classList.contains("etu-settings-row-label")).toBe(true);
    const control = screen.getByRole("combobox", { name: "계정 삭제" });
    expect(control.parentElement?.classList.contains("etu-settings-row-action")).toBe(true);
    expect(control.getAttribute("aria-describedby")).toBe(screen.getByText("삭제 요청 후 30일 동안 취소할 수 있습니다.").id);
  });

  it("supports nested group hierarchy and rejects empty headings", () => {
    const { unmount } = render(
      <SettingsGroup heading="환경" headingLevel={3}>
        <SettingsRow label="언어" />
      </SettingsGroup>,
    );

    expect(screen.getByRole("heading", { level: 3, name: "환경" })).toBeTruthy();
    unmount();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<SettingsGroup heading="" />)).toThrow(
      "SettingsGroup requires a non-empty heading.",
    );
    consoleError.mockRestore();
  });
});
