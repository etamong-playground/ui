import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ui-showcase-locale", "en");
    localStorage.setItem("ui-showcase-theme", "light");
  });
  await page.goto("/#/forms");
});

test("labels, errors and native controls support a complete form", async ({ page }) => {
  const name = page.getByRole("textbox", { name: "Name", exact: true });
  await page.locator("label", { hasText: /^Name/ }).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("required", "");
  await page.getByRole("button", { name: "Save example" }).click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription("The name displayed on screen. Enter a name.");
  await name.fill("Ada");
  await page.getByRole("combobox", { name: "Region" }).selectOption("en");
  await page.getByRole("textbox", { name: "Notes" }).fill("Example note");
  await page.getByRole("button", { name: "Save example" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved: Ada (en)");
  await expect(name).not.toHaveAttribute("aria-invalid");
  await expect(name).toHaveAccessibleDescription("The name displayed on screen.");
  await expect(page.getByRole("textbox", { name: "Read only" })).toHaveAttribute("readonly", "");
  await expect(page.getByRole("textbox", { name: "Unavailable field" })).toBeDisabled();
});

test("password reveal retains focus and selection and never submits the form", async ({ page }) => {
  const input = page.getByLabel("Password", { exact: true });
  await input.fill("example-value");
  await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(2, 6));
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(input).toHaveAttribute("type", "text");
  await expect(input).toBeFocused();
  await expect.poll(() => input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([2, 6]);
  await expect(input).toHaveValue("example-value");
  await expect(page.getByRole("status")).toHaveCount(0);
  const toggle = page.getByRole("button", { name: "Hide password" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(input).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Show password" })).toBeFocused();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("Korean labels follow the selected showcase locale", async ({ page }) => {
  await page.getByRole("button", { name: "KO", exact: true }).click();
  await expect(page.getByRole("button", { name: "비밀번호 보기" })).toBeVisible();
  await page.getByRole("button", { name: "비밀번호 보기" }).click();
  await expect(page.getByRole("button", { name: "비밀번호 숨기기" })).toBeVisible();
});

test("native control chrome inherits class-based and automatic color schemes", async ({ page }) => {
  const select = page.getByRole("combobox", { name: "Region" });
  await page.evaluate(() => {
    delete document.documentElement.dataset.theme;
    document.documentElement.classList.add("dark");
  });
  await expect(select).toHaveCSS("color-scheme", "dark");
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await expect(select).toHaveCSS("color-scheme", "light dark");
});

for (const width of [402, 768, 1280]) {
  for (const theme of ["light", "dark"]) {
    test(`form controls fit ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 874 });
      await page.evaluate((value) => document.documentElement.dataset.theme = value, theme);
      const controls = page.locator(".sc-form-example .etu-input, .sc-form-example .etu-select, .sc-form-example .etu-password-toggle");
      for (const control of await controls.all()) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole("combobox", { name: "Region" })).toHaveCSS("color-scheme", theme);
    });
  }
}
