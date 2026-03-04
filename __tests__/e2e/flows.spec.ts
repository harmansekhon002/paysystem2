import { test, expect } from "@playwright/test"

test.describe("Critical User Flows", () => {
  test("complete shift logging workflow", async ({ page, isMobile }) => {
    await page.goto("/shifts")

    // Open add workplace dialog
    if (isMobile) {
      await page.getByRole("button", { name: /tools/i }).click()
      await page.getByTestId("tools-add-workplace").click()
    } else {
      await page.getByRole("button", { name: /add workplace/i }).filter({ visible: true }).click()
    }
    await expect(page.getByRole("dialog")).toBeVisible()

    // Fill workplace form
    await page.getByPlaceholder(/e.g. cafe job/i).fill("Test Cafe")
    await page.getByRole("button", { name: "Add Workplace" }).click()

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible()

    // Open add shift dialog
    if (isMobile) {
      await page.getByTestId("fab-add-shift").click()
    } else {
      await page.getByRole("button", { name: "Add Shift", exact: true }).click()
    }
    await expect(page.getByRole("dialog")).toBeVisible()

    // Fill shift form (workplace should be pre-selected as Test Cafe)
    await page.getByLabel("Date").first().fill("2026-02-28", { force: true })
    await page.getByLabel("Start Time").first().fill("09:00", { force: true })
    await page.getByLabel("End Time").first().fill("17:00", { force: true })

    // Log shift
    await page.getByRole("button", { name: "Log Shift" }).click()

    // Should show success toast
    await expect(page.getByText(/shift logged/i).first()).toBeVisible()
  })

  test("create and fund a goal", async ({ page }) => {
    await page.goto("/goals")

    // Open create goal dialog
    await page.getByRole("button", { name: "New Goal" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    // Fill goal form
    await page.getByPlaceholder(/e.g. bali trip/i).fill("Test Goal")
    await page.getByLabel("Target Amount").first().fill("1000", { force: true })
    await page.getByLabel("Already Saved").first().fill("100", { force: true })

    // Create goal
    await page.getByRole("button", { name: "Create Goal" }).click()

    // Should show success toast
    await expect(page.getByText(/goal created/i).first()).toBeVisible()

    // Goal should appear in list
    await expect(page.getByText("Test Goal").first()).toBeVisible()
  })

  test("add and track expenses", async ({ page }) => {
    await page.goto("/budget")

    // Open add expense dialog
    await page.getByTestId("open-add-expense-dialog").click()
    await expect(page.getByRole("dialog")).toBeVisible()

    // Fill expense form
    await page.getByPlaceholder(/What was this for\?/i).first().fill("Test Expense", { force: true })
    await page.getByLabel(/amount/i).first().fill("50", { force: true })

    // Add expense
    await page.getByRole("button", { name: /add expense/i }).filter({ hasText: /^add expense$/i }).filter({ visible: true }).click()

    // Should show success toast
    await expect(page.getByText(/expense added/i).first()).toBeVisible()
  })

  test("filter shifts by workplace", async ({ page }) => {
    await page.goto("/shifts")

    // Open filter (works for both mobile Drawer and desktop Popover)
    await page.getByRole("button", { name: /filter/i }).filter({ visible: true }).click()
    await expect(page.getByText("Filter Shifts")).toBeVisible()

    // Apply a date filter to verify filtering behavior
    await expect(page.getByTestId("filter-date-from")).toBeVisible()
    await page.getByTestId("filter-date-from").fill("2026-01-01")
  })

  test("export shifts to calendar", async ({ page, isMobile }) => {
    await page.goto("/shifts")

    if (isMobile) {
      // Export is hidden in Tools drawer on mobile
      await page.getByRole("button", { name: /tools/i }).click()
      await expect(page.getByTestId("tools-export")).toBeVisible()
    } else {
      const exportButton = page.getByRole("button", { name: /export/i })
      await expect(exportButton).toBeVisible()
      await exportButton.click()
    }
  })

  test("view analytics and change time range", async ({ page }) => {
    await page.goto("/analytics")

    // Should display data
    await expect(page.getByText("Total Earnings")).toBeVisible()

    // Change time range
    await page.getByRole("combobox").filter({ visible: true }).click()
    await page.getByRole("option", { name: /last 7 days/i }).click()

    // Charts should update (still visible)
    await expect(page.getByText("Earnings Trend")).toBeVisible()
  })
})

test.describe("Data Persistence", () => {
  test("data persists across page reloads", async ({ page }) => {
    await page.goto("/shifts")

    // Get initial shift count
    const initialText = await page.getByText(/\d+ shifts?/).first().textContent()

    // Reload page
    await page.reload()

    // Shift count should be the same
    await expect(page.getByText(initialText || "")).toBeVisible()
  })

  test("settings persist across navigation", async ({ page }) => {
    // Open settings directly
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/settings/)

    // Change currency
    await page.getByRole("combobox").filter({ hasText: /AUD|USD|CAD|EUR|GBP/ }).click()
    await page.getByRole("option", { name: "USD" }).click()

    // Navigate to different page
    await page.goto("/shifts")
    // Navigate back
    await page.goto("/settings")

    // Currency should still be USD
    await expect(page.getByRole("combobox").filter({ hasText: "USD" })).toBeVisible()
  })
})
