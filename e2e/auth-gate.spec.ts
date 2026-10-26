import { expect } from "@playwright/test";
import { fleetTest as test } from "../src/testing-playwright";

test("scoped auth example switches its keyed account subtree without a network identity lookup", async ({ page }) => {
  const identityRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/me") identityRequests.push(request.url());
  });
  await page.goto("/#/appinfo");
  const demo = page.locator("section.sc-card").filter({ hasText: "Account-scoped AuthGate" });
  await expect(demo.getByRole("status")).toHaveText("Selected fixture: work@example.test");
  await demo.getByRole("combobox", { name: "Account" }).selectOption("personal");
  await expect(demo.getByRole("status")).toHaveText("Selected fixture: personal@example.test");
  await expect(demo.getByText("Selected fixture: work@example.test")).toHaveCount(0);
  await demo.getByRole("combobox", { name: "Account" }).selectOption("work");
  await expect(demo.getByRole("status")).toHaveText("Selected fixture: work@example.test");
  expect(identityRequests).toEqual([]);
});
