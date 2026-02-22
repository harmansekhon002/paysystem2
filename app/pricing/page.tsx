
"use client"

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

import { AppShell } from "@/components/app-shell"

export default function PricingPage() {
  return (
    <AppShell>
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "" }}>
        <div className="max-w-2xl mx-auto py-16">
          <h1 className="text-3xl font-bold mb-6">Pricing</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="border rounded-lg p-6 flex flex-col items-center bg-white shadow-sm">
              <h2 className="text-xl font-semibold mb-2 text-green-700">Free Plan</h2>
              <p className="mb-4 text-2xl font-bold text-green-700">$0<span className="text-base font-normal">/month</span></p>
              <ul className="mb-4 text-sm text-gray-700 text-left list-disc pl-4">
                <li>Track shifts & earnings</li>
                <li>Expense tracking</li>
                <li>Budget management</li>
                <li>Dark mode</li>
                <li>Customizable settings</li>
              </ul>
              <span className="text-green-600 font-medium">Perfect for individuals</span>
            </div>
            {/* Pro Plan */}
            <div className="border-2 border-blue-600 rounded-lg p-6 flex flex-col items-center bg-blue-50 shadow-md relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow">Most Popular</div>
              <h2 className="text-xl font-semibold mb-2 text-blue-700">Pro Plan</h2>
              <p className="mb-4 text-2xl font-bold text-blue-700">$5<span className="text-base font-normal">/month</span></p>
              <ul className="mb-4 text-sm text-blue-900 text-left list-disc pl-4">
                <li>Everything in Free</li>
                <li>Advanced analytics & reporting</li>
                <li>Priority support</li>
                <li>Goal progress tracking</li>
                <li>Export data (CSV/PDF)</li>
                <li>Multi-device sync</li>
                <li>Early access to new features</li>
              </ul>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", color: "blue" }}
                createSubscription={(data, actions) => {
                  return actions.subscription.create({
                    plan_id: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID || "P-YOUR_PLAN_ID_HERE",
                  })
                }}
                onApprove={async (data, actions) => {
                  try {
                    // Send the subscription ID to our backend to activate it for the user
                    const response = await fetch('/api/subscription/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subscriptionId: data.subscriptionID })
                    })

                    if (response.ok) {
                      alert("Subscription active! Welcome to Premium!")
                    } else {
                      console.error("Failed to save subscription details")
                      alert("Subscription created, but failed to sync. Please contact support.")
                    }
                  } catch (error) {
                    console.error("Error activating subscription:", error)
                    alert("Error activating subscription. Please contact support.")
                  }
                }}
              />
              <span className="text-blue-600 font-medium mt-2">Unlock premium features & support</span>
            </div>
          </div>
        </div>
      </PayPalScriptProvider>
    </AppShell>
  )
}
