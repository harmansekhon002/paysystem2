import { test, expect } from "@playwright/test"

test.describe("Critical User Flows", () => {
  test("complete shift logging workflow", async ({ page }) => {
    await page.goto("/shifts")
    
    // Open add workplace dialog
    await page.getByRole("button", { name: /add workplace/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    
    // Fill workplace form
    await page.getByPlaceholder(/e.g. cafe job/i).fill("Test Cafe")
    await page.getByRole("button", { name: "Add Workplace" }).click()
    
    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible()
    
    // Open add shift dialog
    await page.getByRole("button", { name: /add shift/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    
    // Fill shift form (workplace should be pre-selected as Test Cafe)
    await page.getByLabel("Date").fill("2026-02-28")
    await page.getByLabel("Start").fill("09:00")
    await page.getByLabel("End").fill("17:00")
    
    // Log shift
    await page.getByRole("button", { name: "Log Shift" }).click()
    
    // Should show success toast
    await expect(page.getByText(/shift logged/i)).toBeVisible()
  })

  test("create and fund a goal", async ({ page }) => {
    await page.goto("/goals")
    
    // Open create goal dialog
    await page.getByRole("button", { name: /new goal/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    
    // Fill goal form
    await page.getByPlaceholder(/e.g. bali trip/i).fill("Test Goal")
    await page.getByLabel(/target/i).fill("1000")
    await page.getByLabel(/already saved/i).fill("100")
    
    // Create goal
    await page.getByRole("button", { name: "Create Goal" }).click()
    
    // Should show success toast
    await expect(page.getByText(/goal created/i)).toBeVisible()
    
    // Goal should appear in list
    await expect(page.getByText("Test Goal")).toBeVisible()
  })

  test("add and track expenses", async ({ page }) => {
    await page.goto("/budget")
    
    // Open add expense dialog
    await page.getByRole("button", { name: /add expense/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    
    // Fill expense form
    await page.getByPlaceholder(/e.g. groceries/i).fill("Test Expense")
    await page.getByLabel(/amount/i).fill("50")
    
    // Add expense
    await page.getByRole("button", { name: /add expense/i }).filter({ hasText: /^add expense$/i }).click()
    
    // Should show success toast
    await expect(page.getByText(/expense added/i)).toBeVisible()
  })

  test("filter shifts by workplace", async ({ page }) => {
    await page.goto("/shifts")
    
    // Open filter popover
    await page.getByRole("button", { name: /filter/i }).click()
    await expect(page.getByText("Filter Shifts")).toBeVisible()
    
    // Select a workplace filter (select second item in dropdown)
    await page.getByLabel("Workplace").click()
    await page.getByRole("option").nth(1).click()
    
    // Filter should be applied (badge indicator should appear)
    await expect(page.getByRole("button", { name: /filter/i }).getByText("!")).toBeVisible()
  })

  test("export shifts to calendar", async ({ page }) => {
    await page.goto("/shifts")
    
    // Setup download listener
    const downloadPromise = page.waitForEvent("download")
    
    // Click export button
    await page.getByRole("button", { name: /export/i }).click()
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download happened
    expect(download.suggestedFilename()).toContain(".ics")
    
    // Should show success toast
    await expect(page.getByText(/calendar exported/i)).toBeVisible()
  })

  test("view analytics and change time range", async ({ page }) => {
    await page.goto("/analytics")
    
    // Should display data
    await expect(page.getByText("Total Earnings")).toBeVisible()
    
    // Change time range
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: /last 7 days/i }).click()
    
    // Charts should update (still visible)
    await expect(page.getByText("Earnings Trend")).toBeVisible()
  })
})

test.describe("Data Persistence", () => {
  test("data persists across page reloads", async ({ page }) => {
    await page.goto("/shifts")
    
    // Get initial shift count
    const initialText = await page.getByText(/\d+ shifts? logged/).textContent()
    
    // Reload page
    await page.reload()
    
    // Shift count should be the same
    await expect(page.getByText(initialText || "")).toBeVisible()
  })

  test("settings persist across navigation", async ({ page }) => {
    await page.goto("/")
    
    // Open settings
    await page.getByRole("button", { name: /settings/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    
    // Change currency (if not already USD)
    await page.getByLabel("Currency").click()
    await page.getByRole("option", { name: "USD" }).click()
    
    // Close dialog
    await page.keyboard.press("Escape")
    
    // Navigate to different page
    await page.getByRole("link", { name: /shifts/i }).first().click()
    
    // Navigate back
    await page.getByRole("link", { name: /dashboard|home/i }).first().click()
    
    // Open settings again
    await page.getByRole("button", { name: /settings/i }).click()
    
    // Currency should still be USD
    await expect(page.getByLabel("Currency")).toHaveValue("USD")
  })
})
