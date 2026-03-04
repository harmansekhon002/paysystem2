import { test, expect } from "@playwright/test"

test.describe("New Features E2E Tests", () => {
  test("should open Add Shift dialog", async ({ page, isMobile }) => {
    await page.goto("/shifts")

    // Use FAB on mobile, desktop button otherwise
    if (isMobile) {
      await page.getByTestId("fab-add-shift").click()
    } else {
      await page.getByRole("button", { name: "Add Shift", exact: true }).click()
    }
    await expect(page.locator("text=Log a Shift")).toBeVisible()
  })

  test("should open Add Expense dialog", async ({ page }) => {
    await page.goto("/budget")
    await page.getByRole("button", { name: /expense/i }).filter({ visible: true }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("should show Export button", async ({ page, isMobile }) => {
    await page.goto("/shifts")
    if (isMobile) {
      // Export is inside Tools drawer on mobile
      await page.getByRole("button", { name: /tools/i }).click()
      await expect(page.getByTestId("tools-export")).toBeVisible()
    } else {
      await expect(page.locator("button:has-text(\"Export\")")).toBeVisible()
    }
  })
})
