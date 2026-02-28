
"use client"

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"

export default function PricingPage() {
  return (
    <AppShell>
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "" }}>
        <div className="max-w-2xl mx-auto py-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent animate-fade-in">Pricing</h1>
          <p className="text-lg text-muted-foreground text-center mb-10 animate-fade-in delay-100">Choose the plan that fits your hustle. Upgrade anytime.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="flex flex-col items-center font-sans p-2 shadow-lg hover:scale-[1.03] transition-transform duration-300 min-h-[270px]">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Free Plan</h2>
              <p className="mb-4 text-3xl font-extrabold text-foreground">$0<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <ul className="mb-4 text-base text-muted-foreground text-left list-disc pl-4 space-y-1">
                <li>Track shifts & earnings</li>
                <li>Expense tracking</li>
                <li>Budget management</li>
                <li>Dark mode</li>
                <li>Customizable settings</li>
              </ul>
              <span className="text-muted-foreground font-medium mb-4">Perfect for individuals</span>
              <button className="w-full rounded-lg bg-gradient-to-r from-primary to-blue-500 text-white font-semibold py-2 mt-auto shadow-md hover:from-blue-500 hover:to-primary transition-colors duration-200">Get Started</button>
            </Card>
            {/* Pro Plan */}
            <Card className="flex flex-col items-center relative border-2 border-primary ring-2 ring-primary/30 font-sans p-3 shadow-2xl bg-gradient-to-br from-primary/10 to-blue-900/10 scale-105 z-10 animate-pop hover:scale-110 transition-transform duration-300 min-h-[290px]">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">Most Popular</div>
              <h2 className="text-2xl font-extrabold mb-2 text-foreground">Pro Plan</h2>
              <p className="mb-4 text-4xl font-extrabold text-foreground">$5<span className="text-lg font-normal text-muted-foreground">/month</span></p>
              <ul className="mb-4 text-base text-muted-foreground text-left list-disc pl-4 space-y-1">
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
                onApprove={async (data) => {
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
              <button className="w-full rounded-lg bg-gradient-to-r from-primary to-blue-500 text-white font-bold py-3 mt-4 shadow-xl text-lg hover:from-blue-500 hover:to-primary transition-colors duration-200 animate-pulse">Start Free Trial</button>
              <span className="text-muted-foreground font-medium mt-4">Unlock premium features & support</span>
            </Card>
          </div>
        </div>
      </PayPalScriptProvider>
    </AppShell>
  )
}
