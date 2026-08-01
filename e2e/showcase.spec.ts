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

// c2. Palette choseong search — type Korean initials, match by choseong, navigate.
// "ㅂㅈ" is the choseong of "버전" (Versions) and no other palette item.
test("palette choseong search", async ({ page }) => {
  await page.goto("/#/overview");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.locator(".etu-cmdk-input")).toBeVisible();
  await page.locator(".etu-cmdk-input").fill("ㅂㅈ");
  await expect(page.locator(".etu-cmdk-item-label").first()).toHaveText("버전");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/versions/);
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

// f. Theme toggle persistence — toggle inside the sidebar footer's UserMenu
// popover (planning#1133: moved out of the loose footer icon cluster), survives reload
test("theme toggle persistence", async ({ page }) => {
  await page.goto("/#/overview");
  await expect(page.locator(".etu-sidebar")).toBeVisible();

  const initialTheme = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme"),
  );
  const expectedTheme = initialTheme === "dark" ? "light" : "dark";

  await page.locator(".etu-sidebar .etu-user-menu-trigger--full").click();
  await page.getByRole("menuitem", { name: /모드/ }).click();
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

  // g2. Mobile bell — the sidebar (and its nav-row bell) is hidden below
  // 720px, so the bell rides on NavigationBar's trailing edge instead.
  test("notification bell on navigation bar trailing edge", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/overview");
    const navBell = page.locator(".etu-navbar .etu-notif-bell-trigger");
    await expect(navBell).toBeVisible();
    await navBell.click();
    await expect(page.locator(".etu-notif-bell-sheet")).toBeVisible();
  });
});

// g3. Rail collapse — the toggle now lives in the header row; collapsing it
// degrades the bell row's unread badge to a dot that stays visible (not
// hidden), and its popover (portaled to <body>, escaping the sidebar's own
// `overflow: auto`) still opens correctly while the rail is collapsed.
test("rail collapse — bell badge dot and portaled popover", async ({ page }) => {
  await page.goto("/#/overview");
  const sidebar = page.locator(".etu-sidebar");
  await expect(sidebar).toBeVisible();

  await sidebar.locator(".etu-sidebar-rail-toggle").click();
  await expect(sidebar).toHaveAttribute("data-expanded", "false");

  const bellRow = sidebar.getByRole("button", { name: /알림함/ });
  await expect(bellRow).toBeVisible();
  await expect(bellRow.locator(".etu-sidebar-item-badge-dot")).toBeVisible();

  await bellRow.click();
  const popover = page.locator(".etu-notif-bell-popover");
  await expect(popover).toBeVisible();
  const box = await popover.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1280 + 1);
});

// h. Versions view — renders ≥5 version groups and a v0.28.0 heading
test("versions section renders version groups", async ({ page }) => {
  await page.goto("/#/versions");

  const versionLinks = page.locator(".sc-versions-version");
  await expect(versionLinks.first()).toBeVisible();
  expect(await versionLinks.count()).toBeGreaterThanOrEqual(5);

  await expect(versionLinks.filter({ hasText: "v0.28.0" })).toBeVisible();
});

// i. FeatureTag since badge — visible on notifications section and links to version page
test("feature tag since badge links to version page", async ({ page }) => {
  await page.goto("/#/notifications");

  const sinceChip = page.locator(".sc-feature-tag-chip").first();
  await expect(sinceChip).toBeVisible();

  const href = await sinceChip.getAttribute("href");
  expect(href).toMatch(/npmjs\.com|releases\/tag/);
});
