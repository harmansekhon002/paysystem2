import { test, expect } from "@playwright/test"

test.describe("New Features E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000")
  })

  test("should open Add Shift dialog", async ({ page }) => {
    await page.click('a[href="/shifts"]')
    await page.click('button:has-text("Add Shift")')
    await expect(page.locator('text=Log a Shift')).toBeVisible()
  })

  test("should open Add Expense dialog", async ({ page }) => {
    await page.click('a[href="/budget"]')
    await page.click('button:has-text("Expense")')
    await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible()
  })

  test("should show Export button", async ({ page }) => {
    await page.click('a[href="/shifts"]')
    await expect(page.locator('button:has-text("Export")')).toBeVisible()
  })
})
