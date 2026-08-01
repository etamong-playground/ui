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

  // g2b. Regression guard (planning#1151): the bell is mounted inside
  // `<NavigationBar trailing>`, which always applies `backdrop-filter`
  // (`.etu-glass`) — a containing block for `position: fixed` descendants,
  // same as `transform`/`filter`. Pre-fix the non-portaled sheet resolved
  // "fixed" against the header instead of the viewport, landing near the
  // top of the screen (measured around y:-93) instead of sliding up from
  // the bottom. Assert the actual bounding box, not just visibility —
  // `toBeVisible()` alone passed even when the sheet was mispositioned.
  test("mobile bell sheet is anchored to the viewport bottom, not the header", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/overview");
    const navBell = page.locator(".etu-navbar .etu-notif-bell-trigger");
    await navBell.click();

    const sheet = page.locator(".etu-notif-bell-sheet");
    await expect(sheet).toBeVisible();
    const sheetBox = await sheet.boundingBox();
    // Bottom-anchored: the sheet's bottom edge hugs the viewport bottom.
    expect(sheetBox!.y + sheetBox!.height).toBeGreaterThan(800);
    // Nowhere near the header — the pre-fix failure mode landed here.
    expect(sheetBox!.y).toBeGreaterThan(400);
    expect(sheetBox!.x).toBeGreaterThanOrEqual(0);

    // The backdrop is also `position: fixed` and needs the same portal —
    // it should cover the full viewport, not just the header's box.
    const backdropBox = await page.locator(".etu-notif-bell-backdrop").boundingBox();
    expect(backdropBox!.width).toBeGreaterThanOrEqual(390 - 1);
    expect(backdropBox!.height).toBeGreaterThanOrEqual(844 - 1);
  });
});

// g3. Rail collapse — bell lives beside identity now (planning#1133 §6
// correction, v0.48): expanded it's a trailing icon next to the identity
// trigger; collapsed it stacks as its own icon-only rail item directly
// above the avatar, badge intact, and its popover (portaled to <body>,
// escaping the sidebar's own `overflow: auto`) still opens correctly.
test("rail collapse — footer bell stacks above the avatar with its badge, popover opens", async ({ page }) => {
  await page.goto("/#/overview");
  const sidebar = page.locator(".etu-sidebar");
  await expect(sidebar).toBeVisible();

  await sidebar.locator(".etu-sidebar-rail-toggle").click();
  await expect(sidebar).toHaveAttribute("data-expanded", "false");

  const bell = sidebar.locator(".etu-sidebar-footer-accessory .etu-notif-bell-trigger");
  await expect(bell).toBeVisible();
  await expect(bell.locator(".etu-notif-bell-badge")).toBeVisible();

  const avatarTrigger = sidebar.locator(".etu-sidebar-footer .etu-user-menu-trigger--full");
  await expect(avatarTrigger).toBeVisible();

  // "Directly above" — the bell's box sits entirely above the avatar's, not
  // beside it or overlapping (the crowding failure mode §6 rejected).
  const bellBox = await bell.boundingBox();
  const avatarBox = await avatarTrigger.boundingBox();
  expect(bellBox!.y + bellBox!.height).toBeLessThanOrEqual(avatarBox!.y + 1);

  await bell.click();
  const popover = page.locator(".etu-notif-bell-popover");
  await expect(popover).toBeVisible();
  const box = await popover.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1280 + 1);
});

// g3c. Expanded rail — the bell sits beside identity in one row, not
// stacked above it and not full-width (the two rejected shapes from the
// §6 correction's earlier attempts).
test("expanded sidebar — footer bell sits beside identity, not stacked or full-width", async ({ page }) => {
  await page.goto("/#/overview");
  const sidebar = page.locator(".etu-sidebar");
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveAttribute("data-expanded", "true");

  const bell = sidebar.locator(".etu-sidebar-footer-accessory .etu-notif-bell-trigger");
  const avatarTrigger = sidebar.locator(".etu-sidebar-footer .etu-user-menu-trigger--full");
  await expect(bell).toBeVisible();
  await expect(avatarTrigger).toBeVisible();

  const bellBox = await bell.boundingBox();
  const avatarBox = await avatarTrigger.boundingBox();
  // Same row: vertically overlapping, bell to the right of the identity
  // control's right edge.
  expect(bellBox!.y).toBeLessThan(avatarBox!.y + avatarBox!.height);
  expect(bellBox!.y + bellBox!.height).toBeGreaterThan(avatarBox!.y);
  expect(bellBox!.x).toBeGreaterThanOrEqual(avatarBox!.x + avatarBox!.width - 1);
  // Not full-width — a trailing icon button, not a stretched row.
  expect(bellBox!.width).toBeLessThan(60);
});

// g3a2. Regression guard (planning#1133 §6 review round) — the first cut of
// `footerAccessory` used a CSS-only `flex-direction: row-reverse` to render
// the bell trailing while keeping it the first DOM child (for the collapsed
// stacking order). That desynced tab order from visual order: a keyboard
// user tabbing forward would reach the bell BEFORE identity even though the
// bell renders to the right of it. DOM order was changed to track visible
// order in each state instead — this asserts the actual keyboard path, not
// just geometry, since geometry alone passed the whole time this bug shipped.
test("expanded sidebar — Tab from the last nav item reaches identity before the bell", async ({ page }) => {
  await page.goto("/#/overview");
  const sidebar = page.locator(".etu-sidebar");
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveAttribute("data-expanded", "true");

  const lastNavItem = sidebar.locator(".etu-sidebar-section--secondary .etu-sidebar-item").last();
  await lastNavItem.focus();
  await expect(lastNavItem).toBeFocused();

  const avatarTrigger = sidebar.locator(".etu-sidebar-footer .etu-user-menu-trigger--full");
  const bell = sidebar.locator(".etu-sidebar-footer-accessory .etu-notif-bell-trigger");

  await page.keyboard.press("Tab");
  await expect(avatarTrigger).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(bell).toBeFocused();
});

// g3b. Regression guard (planning#1150): two adoption agents disagreed about
// whether the collapsed-rail footer disappears entirely or degrades to an
// avatar — this test settles it. The canonical `<UserMenu variant="full">`
// footer must stay reachable (avatar-only) so identity/sign-out/theme are
// never unreachable once the rail collapses.
test("rail collapse — footer avatar trigger stays reachable and opens its popover", async ({ page }) => {
  await page.goto("/#/overview");
  const sidebar = page.locator(".etu-sidebar");
  await expect(sidebar).toBeVisible();

  await sidebar.locator(".etu-sidebar-rail-toggle").click();
  await expect(sidebar).toHaveAttribute("data-expanded", "false");

  const footer = sidebar.locator(".etu-sidebar-footer");
  await expect(footer).toBeVisible();
  const trigger = footer.locator(".etu-user-menu-trigger--full");
  await expect(trigger).toBeVisible();
  // Name/email hide collapsed — only the avatar survives, mirroring how nav
  // rows degrade to icons.
  await expect(trigger.locator(".etu-user-menu-trigger-text")).toBeHidden();

  await trigger.click();
  const popover = page.locator(".etu-user-menu-dropdown");
  await expect(popover).toBeVisible();
  // Portaled + viewport-clamped (v0.43 groundwork) — stays fully on-screen
  // even anchored to a trigger at the 64px rail width.
  const box = await popover.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1280 + 1);
});

// g4. Crossing into the mobile tier with the footer bell open must not
// strand an orphaned full-screen sheet — the sidebar is CSS-hidden (not
// unmounted) below 720px, so the footer-bell instance stays alive and,
// without the force-close guard, would fall into the mobile-sheet branch
// the moment `isMobile` flips true.
test("footer bell auto-closes when the viewport crosses into the mobile tier", async ({ page }) => {
  await page.goto("/#/overview");
  const sidebar = page.locator(".etu-sidebar");
  await expect(sidebar).toBeVisible();

  const bell = sidebar.locator(".etu-sidebar-footer-accessory .etu-notif-bell-trigger");
  await bell.click();
  await expect(page.locator(".etu-notif-bell-popover")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });

  await expect(page.locator(".etu-notif-bell-sheet")).not.toBeVisible();
  await expect(page.locator(".etu-notif-bell-backdrop")).toHaveCount(0);
  await expect(page.locator(".etu-notif-bell-popover")).not.toBeVisible();
  const overflow = await page.evaluate(() => document.body.style.overflow);
  expect(overflow).not.toBe("hidden");
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
