# ShiftWise - Advanced Features

## ✨ New Features Added

### 1. **Advanced Filtering** (Shifts Page)
Filter shifts by multiple criteria:
- **Workplace**: Filter by specific job/workplace
- **Rate Type**: Filter by weekday, Saturday, Sunday, public holiday, or overtime
- **Date Range**: Filter shifts between specific dates (from/to)
- Active filter indicator badge
- Clear all filters button

**Usage:**
- Click the "Filter" button on the Shifts page
- Select filter criteria in the popover
- Filtered shifts display with count (e.g., "8 shifts (10 total)")

### 2. **Recurring Shifts** (Shifts Page)
Schedule repeating shifts automatically:
- Create shift templates with workplace, times, and break duration
- Select multiple days of the week
- Set number of weeks to schedule
- Automatically detects rate types (weekday/weekend/public holiday)
- Bulk creates shifts with a single click

**Usage:**
- Click "Recurring" button on Shifts page
- Fill in template details (name, workplace, times, break)
- Select days of week (Sun-Sat buttons)
- Set number of weeks
- Click "Schedule Shifts"

**Example:** Create a "Weekend Cafe" template for Saturday + Sunday, 9am-5pm, for 4 weeks = 8 shifts created automatically

### 3. **Browser Notifications** (Goals Page)
Milestone notifications for goal progress:
- Notifications at 25%, 50%, 75%, and 100% completion
- Special congratulations message at 100%
- One-time permission request
- Visual indicator showing notification status

**Milestones:**
- 25%: "You've reached 25% of your goal! Keep going!"
- 50%: "You've reached 50% of your goal! Keep going!"
- 75%: "You've reached 75% of your goal! Keep going!"
- 100%: "Congratulations on completing your goal! 🎊" (requires interaction)

**Usage:**
- Click "Enable Alerts" button on Goals page
- Grant browser notification permission
- Add funds to goals to trigger milestone notifications

### 4. **Calendar Export** (Shifts Page)
Export shifts to iCalendar (.ics) format:
- Works with all filtered or all shifts
- Compatible with Google Calendar, Apple Calendar, Outlook
- Includes shift details: workplace, hours, earnings, rate type, notes
- Automatic file download

**Usage:**
- Optionally apply filters to export specific shifts
- Click "Export" button
- File downloads as `shiftwise-YYYY-MM-DD.ics`
- Import into your calendar app

**Event Details Include:**
- Title: "Workplace Name - Rate Type"
- Time: Start and end times
- Description: Hours, hourly rate, total earnings, notes

### 5. **Multi-Currency Support**
Support for 8 major currencies with live exchange rates:
- **Supported Currencies**: AUD, USD, EUR, GBP, NZD, CAD, JPY, CNY
- Live exchange rates from exchangerate-api.com
- Automatic rate caching (1 hour)
- Fallback rates if API unavailable
- localStorage persistence

**Currencies:**
- 🇦🇺 Australian Dollar (AUD) - $
- 🇺🇸 US Dollar (USD) - $
- 🇪🇺 Euro (EUR) - €
- 🇬🇧 British Pound (GBP) - £
- 🇳🇿 New Zealand Dollar (NZD) - $
- 🇨🇦 Canadian Dollar (CAD) - $
- 🇯🇵 Japanese Yen (JPY) - ¥
- 🇨🇳 Chinese Yuan (CNY) - ¥

**Usage:**
- Currency selector in Settings dialog (app shell)
- Rates update automatically every hour
- All amounts display in selected currency

### 6. **Advanced Analytics Dashboard** (New Page)
Comprehensive reporting and insights:

**KPI Cards:**
- Total Earnings (with trend vs previous period)
- Total Hours worked
- Average Hourly Rate
- Net Income (earnings - expenses)

**Charts:**
1. **Earnings Trend** (Line Chart)
   - Daily earnings over time
   - Interactive tooltips with exact amounts

2. **Earnings by Workplace** (Bar Chart)
   - Compare earnings across different jobs
   - Color-coded by workplace

3. **Earnings by Rate Type** (Pie Chart)
   - Breakdown of earnings: weekday, Saturday, Sunday, public holiday, overtime
   - Shows percentage distribution

4. **Expenses by Category** (Progress Bars)
   - Expense breakdown with percentages
   - Visual progress indicators

5. **Goals Progress** (Cards)
   - All goals with progress bars
   - Percentage complete
   - Days left indicator
   - Status badges (Complete/On Track/Behind/Overdue)

**Time Ranges:**
- Last 7 Days
- Last 30 Days
- Last Quarter (90 days)
- Last Year (365 days)

**Usage:**
- Navigate to Analytics page in sidebar
- Select time range from dropdown
- View comprehensive insights
- All charts are interactive with tooltips

### 7. **Expanded Test Coverage**
Added 19 new unit tests across 2 test suites:

**Currency Tests** (`tests/currency.test.ts`):
- Currency conversion between all pairs
- Formatting with currency symbols
- Rounding to 2 decimal places
- Currency code display

**Notification Tests** (`tests/notifications.test.ts`):
- Goal milestone triggers (25%, 50%, 75%, 100%)
- Earnings milestone notifications
- No false triggers
- Special handling for 100% completion

**Total Coverage:**
- 3 test files
- 23 passing tests
- Store helpers, currency utilities, notifications

### 8. **E2E Test Suite** (Playwright)
Comprehensive end-to-end testing:

**Test Files:**
1. **`e2e/app.spec.ts`** - Component testing
   - Shifts Tracker page interactions
   - Goals page functionality
   - Budget Planner operations
   - Analytics Dashboard display
   - Navigation between pages
   - Theme toggle
   - Settings dialog

2. **`e2e/flows.spec.ts`** - Critical user flows
   - Complete shift logging workflow (add workplace → log shift)
   - Create and fund a goal
   - Add and track expenses
   - Filter shifts by workplace
   - Export shifts to calendar
   - View analytics and change time range
   - Data persistence across reloads
   - Settings persistence across navigation

**Running E2E Tests:**
```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Run with UI mode (visual debugging)
pnpm test:e2e:ui

# Debug mode (step through tests)
pnpm test:e2e:debug
```

**Supported Browsers:**
- Chromium
- Firefox
- WebKit (Safari)

## 📦 Installation & Setup

### Install Dependencies
```bash
pnpm install
```

This will install:
- `@playwright/test` for E2E testing
- All existing dependencies

### Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Run Tests
```bash
# Unit tests
pnpm test

# Unit tests (watch mode)
pnpm test:watch

# Lint
pnpm lint

# E2E tests (requires dev server or build)
pnpm test:e2e
```

## 🎯 Feature Summary

| Feature | Location | Key Benefits |
|---------|----------|-------------|
| Advanced Filtering | Shifts Page | Quickly find specific shifts |
| Recurring Shifts | Shifts Page | Schedule repeating shifts in bulk |
| Browser Notifications | Goals Page | Stay motivated with milestone alerts |
| Calendar Export | Shifts Page | Sync shifts with external calendars |
| Multi-Currency | Settings | Support for international users |
| Analytics Dashboard | Analytics Page | Comprehensive insights and trends |
| Unit Tests | 23 tests | Ensure code quality and reliability |
| E2E Tests | 2 test suites | Validate critical user workflows |

## 🚀 Usage Tips

### Filtering Shifts
1. Use date range filters to view shifts for specific pay periods
2. Filter by rate type to see which shifts earn penalty rates
3. Combine filters for precise queries (e.g., "Weekend shifts at Cafe in February")

### Recurring Shifts
1. Create templates for regular work schedules (e.g., "Monday & Wednesday nights")
2. Useful for part-time students with consistent weekly shifts
3. Saves time vs. logging each shift individually

### Calendar Integration
1. Export filtered shifts to create focused calendar views
2. Import into Google Calendar to see shifts alongside classes/events
3. Re-export monthly to keep external calendars updated

### Analytics Insights
1. Compare "Last 30 Days" vs "Last Quarter" to spot earning trends
2. Use rate type breakdown to optimize shift selection (prioritize penalty rates)
3. Monitor net income to ensure expenses stay within earnings

### Testing Workflow
1. Run `pnpm test` before committing changes
2. Use `pnpm test:watch` during development
3. Run `pnpm test:e2e` before deploying to verify critical flows

## 🌐 Browser Compatibility

**Production App:**
- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

**E2E Tests:**
- Chromium, Firefox, WebKit
- Cross-browser testing ensures consistent UX

## 📊 Analytics Metrics Tracked

**Events (13 total):**
- `shift_added`, `shift_removed`
- `workplace_added`, `workplace_removed`
- `recurring_shifts_added`
- `calendar_exported`
- `goal_added`, `goal_funded`
- `expense_added`
- `budget_category_added`
- `notifications_enabled`
- `currency_changed`

Ready for integration with Vercel Analytics or other tracking platforms.

## 🛠️ Technical Stack Updates

**New Dependencies:**
- `@playwright/test` ^1.49.1 - E2E testing framework

**New Files:**
- `lib/notifications.ts` - Browser notification utilities
- `lib/currency.ts` - Multi-currency support
- `components/reporting.tsx` - Analytics dashboard
- `app/analytics/page.tsx` - Analytics route
- `tests/currency.test.ts` - Currency unit tests
- `tests/notifications.test.ts` - Notification unit tests
- `e2e/app.spec.ts` - Component E2E tests
- `e2e/flows.spec.ts` - User flow E2E tests
- `playwright.config.ts` - Playwright configuration

**Enhanced Files:**
- `components/shifts-tracker.tsx` - Added filtering, recurring shifts, export
- `components/goals.tsx` - Added notification support
- `components/app-shell.tsx` - Added Analytics navigation
- `package.json` - Added Playwright scripts and dependency

## 📝 Development Notes

### Notification Permissions
- Requires user interaction to request permission
- Only works over HTTPS in production
- localStorage tracks permission status

### Exchange Rates
- Cached for 1 hour to reduce API calls
- Free tier: 1500 requests/month
- Falls back to approximate rates if API fails

### Test Isolation
- E2E tests run in isolated browser contexts
- Unit tests use mocked dependencies (Notification API)
- No cross-test pollution

### Performance Considerations
- useMemo/useCallback used for expensive computations
- Charts re-render only when data/timeRange changes
- localStorage sync is debounced in data-provider

## 🎉 What's Next?

All 8 requested features are now complete:
- ✅ Advanced Filtering
- ✅ Recurring Shifts
- ✅ Browser Notifications
- ✅ Calendar Integration
- ✅ Multi-Currency Support
- ✅ Reporting Dashboard
- ✅ Expanded Test Coverage (23 tests)
- ✅ E2E Test Suite (Playwright)

**Production Ready:**
- All tests passing (23/23 unit tests)
- Clean lint (no errors/warnings)
- Successful build (9 routes prerendered)
- E2E tests ready for validation

Enjoy your enhanced ShiftWise experience! 🚀
