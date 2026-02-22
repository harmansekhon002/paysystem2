# ShiftWise

A modern app for tracking shifts, earnings, expenses, and goals, with support for Australian penalty rates and more.

## Features
- Shift, earnings, and expense tracking
- Budget and goals management
- Dark mode and customizable settings
- Modern, responsive UI

## Getting Started
1. Install dependencies: `pnpm install`
2. Run the app: `pnpm run dev`

## Stripe Monetization Setup

To enable paid subscriptions with Stripe:

1. Set these environment variables in Vercel and `.env.local`:
   - `STRIPE_SECRET_KEY` (from your Stripe dashboard)
   - `STRIPE_PUBLISHABLE_KEY` (from your Stripe dashboard)
   - `STRIPE_WEBHOOK_SECRET` (from your Stripe webhook settings)
2. Update the `priceId` in `/app/pricing/page.tsx` to your actual Stripe Price ID.
3. Deploy to Vercel. Stripe API routes are ready at `/api/checkout` and `/api/webhook`.
4. Test payments in Stripe test mode before going live.

See Stripe docs for more: https://stripe.com/docs/checkout/quickstart

## PayPal Monetization Setup

To enable payments with PayPal:

1. Set these environment variables in Vercel and `.env.local`:
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (from your PayPal developer dashboard)
   - `PAYPAL_SECRET` (optional, for backend verification)
2. Install PayPal SDK: `pnpm add @paypal/react-paypal-js`
3. The pricing page is integrated with PayPal Buttons.
4. Deploy to Vercel. Payments are handled client-side.

See PayPal docs for more: https://developer.paypal.com/docs/business/checkout/

## License
See [LICENSE](LICENSE).
