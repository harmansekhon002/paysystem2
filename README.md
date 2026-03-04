# ShiftWise 💡

**Smart shift management for students who hustle.**  
Track hours, calculate penalty rates, budget smarter, and hit your savings goals — all from your phone.

---

## Features

- 📅 **Shift Tracker** — Log shifts with Australian penalty rate calculation (weekday, weekend, public holiday, casual)
- 💰 **Earnings Dashboard** — Real-time income summaries and pay period breakdowns
- 🎯 **Savings Goals** — Set targets, fund them from earnings, get milestone notifications  
- 📊 **Analytics** — Charts for earnings trends, workplace comparison, and rate type breakdown
- 💳 **Budget Planner** — Track expenses against monthly category budgets
- 📱 **PWA** — Install on iPhone/Android, works offline, push notifications
- 🌙 **Themes** — Light, Dark, OLED Deep Black

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via Neon + Prisma ORM |
| Auth | NextAuth.js (Credentials provider) |
| Payments | PayPal Subscriptions |
| UI | Tailwind CSS + Radix UI |
| Testing | Vitest (unit) + Playwright (E2E) |
| Deployment | Vercel |

---

## Local Setup

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A PostgreSQL database (or [Neon](https://neon.tech) free tier)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/harmansekhon002/paysystem2.git
cd paysystem2

# 2. Install dependencies
pnpm install

# 3. Copy env file and fill in values
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, NEXTAUTH_SECRET, etc.

# 4. Run database migrations
npx prisma migrate dev

# 5. Start dev server
npm run dev
# Visit http://localhost:3000
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Neon) |
| `NEXTAUTH_URL` | Full URL of your deployment |
| `NEXTAUTH_SECRET` | Random secret: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL |
| `PAYPAL_CLIENT_ID` | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal app secret |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client ID (public) |

---

## Running Tests

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright — Mobile Chrome & Safari)
npm run build
npm run test:e2e
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add all environment variables in **Settings → Environment Variables**
4. Deploy — Vercel auto-detects Next.js and uses `pnpm install` + `next build`

> The `vercel.json` configures the build command automatically.

---

## License

MIT © Harman Sekhon
