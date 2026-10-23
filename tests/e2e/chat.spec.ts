import { test, expect } from "@playwright/test";

test("user can query runbooks and trigger approval flow", async ({ page }) => {
  await page.goto("http://localhost:3000");

  const input = page.locator('input[placeholder*="Ask about runbooks"]');
  await input.fill("Please restart the database to fix high CPU.");
  await page.locator('button:has-text("Send")').click();

  // Assert human approval widget appears
  const approvalCard = page.locator("text=Human Approval Required");
  await expect(approvalCard).toBeVisible();

  // Click approve
  await page.locator('button:has-text("Approve Action")').click();

  // Assert final execution response
  await expect(page.locator("text=successfully executed")).toBeVisible();
});
