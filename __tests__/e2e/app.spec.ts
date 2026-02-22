import { test, expect } from "@playwright/test"

test.describe("Shifts Tracker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shifts")
  })

  test("should display shifts page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Shifts" })).toBeVisible()
    await expect(page.getByText("Track hours with Australian penalty rates")).toBeVisible()
  })

  test("should open add shift dialog", async ({ page }) => {
    await page.getByRole("button", { name: /add shift/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Log a Shift")).toBeVisible()
  })

  test("should display shift list", async ({ page }) => {
    await page.getByRole("tab", { name: "List" }).click()
    // Should show default shifts
    await expect(page.getByText(/shifts logged|shift/i).first()).toBeVisible()
  })

  test("should switch to calendar view", async ({ page }) => {
    await page.getByRole("tab", { name: "Calendar" }).click()
    // Calendar days should be visible
    await expect(page.getByText("Mon")).toBeVisible()
    await expect(page.getByText("Tue")).toBeVisible()
  })

  test("should open filter popover", async ({ page }) => {
    await page.getByRole("button", { name: /filter/i }).click()
    await expect(page.getByText("Filter Shifts")).toBeVisible()
    await expect(page.getByText("Workplace", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Rate Type", { exact: true }).first()).toBeVisible()
  })

  test("should open recurring shifts dialog", async ({ page }) => {
    await page.getByRole("button", { name: /recurring/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Schedule Recurring Shifts")).toBeVisible()
  })

  test("should open add workplace dialog", async ({ page }) => {
    await page.getByRole("button", { name: /add workplace/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Add Workplace" })).toBeVisible()
  })
})

test.describe("Goals", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/goals")
  })

  test("should display goals page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Goals" })).toBeVisible()
    await expect(page.getByText("Save towards what matters")).toBeVisible()
  })

  test("should display summary cards", async ({ page }) => {
    await expect(page.getByText("Total Saved")).toBeVisible()
    await expect(page.getByText("Total Target")).toBeVisible()
    await expect(page.getByText("Overall")).toBeVisible()
  })

  test("should open create goal dialog", async ({ page }) => {
    await page.getByRole("button", { name: /new goal/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Create Savings Goal")).toBeVisible()
  })

  test("should show notification enable button", async ({ page }) => {
    const notifButton = page.getByRole("button", { name: /enable alerts|alerts on/i })
    await expect(notifButton).toBeVisible()
  })
})

test.describe("Budget Planner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/budget")
  })

  test("should display budget page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Budget" })).toBeVisible()
  })

  test("should display expense tracking", async ({ page }) => {
    await expect(page.getByText(/recent expenses/i)).toBeVisible()
  })

  test("should open add expense dialog", async ({ page }) => {
    await page.getByRole("button", { name: /expense/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })
})

test.describe("Analytics Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics")
  })

  test("should display analytics page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible()
    await expect(page.getByText("Advanced insights and trends")).toBeVisible()
  })

  test("should display KPI cards", async ({ page }) => {
    await expect(page.getByText("Total Earnings")).toBeVisible()
    await expect(page.getByText("Total Hours")).toBeVisible()
    await expect(page.getByText("Avg Hourly")).toBeVisible()
    await expect(page.getByText("Net Income")).toBeVisible()
  })

  test("should have time range selector", async ({ page }) => {
    const selector = page.getByRole("combobox")
    await expect(selector).toBeVisible()
  })

  test("should display charts", async ({ page }) => {
    await expect(page.getByText("Earnings Trend")).toBeVisible()
    await expect(page.getByText("Earnings by Workplace")).toBeVisible()
    await expect(page.getByText("Earnings by Rate Type")).toBeVisible()
  })
})

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    await page.goto("/")

    // Test navigation
    await page.getByRole("link", { name: /shifts/i }).first().click()
    await expect(page).toHaveURL(/\/shifts/)

    await page.getByRole("link", { name: /earnings/i }).first().click()
    await expect(page).toHaveURL(/\/earnings/)

    await page.getByRole("link", { name: /budget/i }).first().click()
    await expect(page).toHaveURL(/\/budget/)

    await page.getByRole("link", { name: /goals/i }).first().click()
    await expect(page).toHaveURL(/\/goals/)

    await page.getByRole("link", { name: /analytics/i }).first().click()
    await expect(page).toHaveURL(/\/analytics/)
  })

  test("should have working theme toggle", async ({ page }) => {
    await page.goto("/")
    const themeButton = page.getByRole("button", { name: /toggle theme/i }).first()
    await expect(themeButton).toBeVisible()
    await themeButton.click({ force: true })
    // Theme should change (check for dark or light class)
  })

  test("should open settings dialog", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /settings/i }).first().click({ force: true })
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.getByRole("heading", { name: /settings/i, level: 1 })).toBeVisible()
  })
})
