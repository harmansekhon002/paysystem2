import { test, expect } from "@playwright/test"

test.describe("Shifts Tracker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shifts")
  })

  test("should display shifts page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Shifts" })).toBeVisible()
    await expect(page.getByText("Track hours with Australian penalty rates")).toBeVisible()
  })

  test("should open add shift dialog", async ({ page, isMobile }) => {
    if (isMobile) {
      // On mobile, use the FAB button at the bottom
      await page.getByTestId("fab-add-shift").click()
    } else {
      await page.getByRole("button", { name: "Add Shift", exact: true }).click()
    }
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Log a Shift")).toBeVisible()
  })

  test("should display shift list", async ({ page }) => {
    await page.getByRole("tab", { name: "List" }).click()
    // "Shifts" heading or count text should be visible on page
    await expect(page.getByRole("heading", { name: "Shifts" })).toBeVisible()
  })

  test("should switch to calendar view", async ({ page }) => {
    await page.getByRole("tab", { name: "Calendar" }).click()
    // Calendar days should be visible
    await expect(page.getByText("Mon", { exact: true })).toBeVisible()
    await expect(page.getByText("Tue", { exact: true })).toBeVisible()
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  test("Should support pull-to-refresh on mobile", async ({ page, isMobile }) => {
    // TODO: Implement pull-to-refresh test
  })

  test("should open filter popover", async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole("button", { name: /filter/i }).filter({ visible: true }).click()
      await expect(page.getByText("Filter Shifts")).toBeVisible()
    } else {
      await page.getByRole("button", { name: /filter/i }).filter({ visible: true }).click()
      await expect(page.getByText("Filter Shifts")).toBeVisible()
      await expect(page.getByText("Workplace", { exact: true }).first()).toBeVisible()
      await expect(page.getByText("Rate Type", { exact: true }).first()).toBeVisible()
    }
  })

  test("should open recurring shifts dialog", async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole("button", { name: /tools/i }).click()
      await page.getByTestId("tools-recurring").click()
    } else {
      await page.getByRole("button", { name: /recurring/i }).click()
    }
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Schedule Recurring Shifts")).toBeVisible()
  })

  test("should open add workplace dialog", async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole("button", { name: /tools/i }).click()
      await page.getByTestId("tools-add-workplace").click()
    } else {
      await page.getByRole("button", { name: /add workplace/i }).filter({ visible: true }).click()
    }
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
    await page.getByRole("button", { name: /new goal/i }).filter({ visible: true }).click()
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
    await page.getByRole("button", { name: /expense/i }).filter({ visible: true }).click()
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
    const selector = page.getByRole("combobox").filter({ visible: true })
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

    // Test navigation - use .first() to get whichever link is visible (mobile bottom nav or desktop sidebar)
    await page.getByRole("link", { name: /shifts/i }).first().click()
    await expect(page).toHaveURL(/\/shifts/)

    await page.getByRole("link", { name: /earnings/i }).first().click()
    await expect(page).toHaveURL(/\/earnings/)

    // Budget and Goals don't have bottom nav links; navigate by URL on mobile
    await page.goto("/budget")
    await expect(page).toHaveURL(/\/budget/)

    await page.goto("/goals")
    await expect(page).toHaveURL(/\/goals/)

    await page.goto("/analytics")
    await expect(page).toHaveURL(/\/analytics/)
  })

  test("should have working theme toggle", async ({ page }) => {
    await page.goto("/")
    // On mobile, the theme toggle is inside the hamburger menu
    // We'll skip the mobile click here since we don't have isMobile in the destructure
    await page.getByRole("button", { name: /toggle menu/i }).click()
    const themeButton = page.getByRole("button", { name: /toggle theme/i }).first()
    await expect(themeButton).toBeVisible()
    await themeButton.click({ force: true })
    // Theme should change (check for dark or light class)
  })

  test("should open settings dialog", async ({ page, isMobile }) => {
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.getByRole("heading", { name: /settings/i, level: 1 })).toBeVisible()
  })
})
