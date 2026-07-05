import { expect } from "@playwright/test";
import { fleetTest as test } from "../src/testing-playwright";

// a. Shell layout regression — sidebar present, content not under it
test("shell layout regression", async ({ page }) => {
  await page.goto("/#/overview");

  const sidebar = page.locator(".etu-sidebar");
  await expect(sidebar).toBeVisible();

  const h2Box = await page.locator(".sc-section h2").boundingBox();
  expect(h2Box!.y).toBeLessThan(300);

  const sidebarBox = await sidebar.boundingBox();
  const mainBox = await page.locator(".sc-main-area").boundingBox();
  expect(mainBox!.x).toBeGreaterThanOrEqual(sidebarBox!.width);
});

// b. Palette overlay dismiss — THE regression guard for the CSS fix
test("palette overlay dismiss", async ({ page }) => {
  await page.goto("/#/overview");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.locator(".etu-cmdk-input")).toBeVisible();
  // Click bottom-left corner — outside the centered palette panel
  await page.mouse.click(20, 700);
  await expect(page.locator(".etu-cmdk-input")).not.toBeVisible();
});

// c. Palette navigation — type Korean, press Enter, URL changes
test("palette navigation", async ({ page }) => {
  await page.goto("/#/overview");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.locator(".etu-cmdk-input")).toBeVisible();
  await page.locator(".etu-cmdk-input").fill("알림");
  await expect(page.locator(".etu-cmdk-item").first()).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/notifications/);
});

// d. Dialog defaults + overflow — cancel button is "취소" (Korean default), input in bounds
test("dialog defaults and overflow", async ({ page }) => {
  await page.goto("/#/notifications");
  await page.getByRole("button", { name: "uiPrompt" }).click();

  const dialog = page.locator(".etu-dialog");
  await expect(dialog).toBeVisible();

  await expect(dialog.locator(".etu-dialog-btn").first()).toHaveText("취소");

  const dialogBox = await dialog.boundingBox();
  const inputBox = await dialog.locator(".etu-dialog-input").boundingBox();
  expect(inputBox!.x).toBeGreaterThanOrEqual(dialogBox!.x - 1);
  expect(inputBox!.y).toBeGreaterThanOrEqual(dialogBox!.y - 1);
  expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(
    dialogBox!.x + dialogBox!.width + 1,
  );
  expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(
    dialogBox!.y + dialogBox!.height + 1,
  );

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

// e. Toast — click ok toast button, toast element appears
test("toast", async ({ page }) => {
  await page.goto("/#/notifications");
  await page.getByRole("button", { name: 'toast "ok"' }).click();
  await expect(page.locator(".etu-toast")).toBeVisible();
});

// f. Theme toggle persistence — toggle in sidebar, survives reload
test("theme toggle persistence", async ({ page }) => {
  await page.goto("/#/overview");
  await expect(page.locator(".etu-sidebar")).toBeVisible();

  const initialTheme = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme"),
  );
  const expectedTheme = initialTheme === "dark" ? "light" : "dark";

  await page.locator(".etu-sidebar").getByRole("button", { name: /mode/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", expectedTheme);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", expectedTheme);
});

// g. Mobile tier — tab bar visible, sidebar hidden at 390px
test.describe("mobile tier", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/overview");
    await expect(page.locator(".etu-mobile-tab-bar")).toBeVisible();
    await expect(page.locator(".etu-sidebar")).not.toBeVisible();
  });
});
