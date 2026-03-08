"use client"

import { useRef, useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import Link from "next/link"
import Script from "next/script"

import { AppShell } from "@/components/app-shell"
import { useAppData } from "@/components/data-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PaidPlan = {
  name: string
  price: string
  description: string
  badge: string
  planId: string
  missingEnvVar: string
  successMessage: string
  ctaLabel: string
  subCta: string
  features: string[]
  highlighted?: boolean
}

export default function PricingPage() {
  const { toast } = useToast()
  const { planName, refreshPlan } = useAppData()
  const [syncingSubscriptionId, setSyncingSubscriptionId] = useState<string | null>(null)
  const [lastSyncState, setLastSyncState] = useState<{
    status: "success" | "error"
    message: string
    subscriptionId?: string
  } | null>(null)
  const processedSubscriptionIds = useRef(new Set<string>())
  const idempotencyBySubscriptionId = useRef(new Map<string, string>())

  const plusPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLUS_MONTHLY_PLAN_ID || ""
  const proPlanId = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID || ""

  const [waitlistPlan, setWaitlistPlan] = useState<string | null>(null)
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false)

  useEffect(() => {
    const handler = (e: any) => setWaitlistPlan(e.detail)
    window.addEventListener("open-waitlist", handler)
    return () => window.removeEventListener("open-waitlist", handler)
  }, [])

  const handleJoinWaitlist = async () => {
    if (!waitlistEmail) {
      toast({ title: "Email required", description: "Please enter your email to join the waitlist.", variant: "destructive" })
      return
    }

    setSubmittingWaitlist(true)
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, plan: waitlistPlan }),
      })

      if (response.ok) {
        toast({ title: "Joined!", description: "You're on the list! We'll notify you when this plan launches." })
        setWaitlistPlan(null)
        setWaitlistEmail("")
      } else {
        throw new Error("Failed to join")
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not join waitlist right now. Please try again later.", variant: "destructive" })
    } finally {
      setSubmittingWaitlist(false)
    }
  }

  const paidPlans: PaidPlan[] = [
    {
      name: "Plus",
      price: "$2.50",
      description: "For regular workers who want clearer monthly insights.",
      badge: "Most Popular",
      planId: plusPlanId,
      missingEnvVar: "NEXT_PUBLIC_PAYPAL_PLUS_MONTHLY_PLAN_ID",
      successMessage: "Plus subscription active! Welcome!",
      ctaLabel: "Upgrade to Plus",
      subCta: "Billed monthly. Cancel anytime.",
      features: [
        "Everything in Free",
        "Rate-type earnings breakdown",
        "Monthly summary insights",
        "CSV exports",
        "Priority email support",
      ],
    },
    {
      name: "Pro",
      price: "$5",
      description: "For serious users who want full control and advanced reports.",
      badge: "Best Results",
      planId: proPlanId,
      missingEnvVar: "NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID",
      successMessage: "Subscription active! Welcome to Pro!",
      ctaLabel: "Go Pro",
      subCta: "Billed monthly. Cancel anytime.",
      features: [
        "Everything in Plus",
        "Advanced analytics dashboard",
        "Trend forecasting",
        "Unlimited goals and budgets",
        "CSV and PDF exports",
        "Fastest support turnaround",
      ],
      highlighted: true,
    },
  ]

  const productSchemas = [
    {
      name: "Starter",
      description: "Perfect for getting started with shift and expense tracking.",
      price: "0",
    },
    ...paidPlans.map((plan) => ({
      name: plan.name,
      description: plan.description,
      price: plan.price.replace(/[^0-9.]/g, "") || "0",
    })),
  ].map((plan) => ({
    "@type": "Product",
    name: plan.name,
    description: plan.description,
    offers: {
      "@type": "Offer",
      price: plan.price,
      priceCurrency: "USD",
    },
  }))

  const getIdempotencyKeyForSubscription = (subscriptionId: string) => {
    const existing = idempotencyBySubscriptionId.current.get(subscriptionId)
    if (existing) return existing

    const fallback = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const key = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallback
    idempotencyBySubscriptionId.current.set(subscriptionId, key)
    return key
  }

  const handleSubscriptionApproved = async (subscriptionId: string, successMessage: string, planName: string) => {
    if (processedSubscriptionIds.current.has(subscriptionId) || syncingSubscriptionId === subscriptionId) {
      return
    }

    setSyncingSubscriptionId(subscriptionId)
    try {
      const idempotencyKey = getIdempotencyKeyForSubscription(subscriptionId)
      const response = await fetch("/api/subscription/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({ subscriptionId }),
      })

      if (response.ok) {
        processedSubscriptionIds.current.add(subscriptionId)
        await refreshPlan()
        setLastSyncState({
          status: "success",
          message: `${successMessage} Your billing profile is synced.`,
          subscriptionId,
        })
        toast({
          title: `${planName} activated`,
          description: "Subscription is active and synced.",
        })
      } else {
        setLastSyncState({
          status: "error",
          message: "Subscription created, but syncing failed. You can retry by subscribing again with the same key safely.",
          subscriptionId,
        })
        toast({
          title: "Subscription sync failed",
          description: "Your payment may be approved. Open Settings > Subscription to verify status.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error activating subscription:", error)
      setLastSyncState({
        status: "error",
        message: "Could not sync subscription details due to a network error.",
        subscriptionId,
      })
      toast({
        title: "Network error",
        description: "Could not sync subscription details. Please retry.",
        variant: "destructive",
      })
    } finally {
      setSyncingSubscriptionId(null)
    }
  }

  return (
    <AppShell>
      <Script
        id="pricing-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": productSchemas }) }}
      />
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "" }}>
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="from-primary to-primary/70 animate-fade-in bg-gradient-to-r bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
              Pick the right plan
            </h1>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed md:text-lg">
              Start free today, then unlock more insights and automation as your workload grows.
            </p>
            <div className="mt-3">
              <Badge variant="secondary">Current plan: {planName}</Badge>
            </div>
            {syncingSubscriptionId ? (
              <div className="mt-4">
                <Badge variant="secondary">Syncing subscription...</Badge>
              </div>
            ) : null}
            {lastSyncState ? (
              <div className="mt-4">
                <Alert variant={lastSyncState.status === "error" ? "destructive" : "default"}>
                  <AlertTitle>{lastSyncState.status === "error" ? "Sync issue" : "Subscription synced"}</AlertTitle>
                  <AlertDescription>
                    {lastSyncState.message}
                    {lastSyncState.subscriptionId ? (
                      <span className="mt-1 block text-xs font-mono">ID: {lastSyncState.subscriptionId}</span>
                    ) : null}
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <Card className="border-border/80 bg-card/90 flex h-full flex-col overflow-hidden rounded-2xl border p-6 shadow-sm">
              <div className="mb-4">
                <p className="text-muted-foreground mb-2 text-sm font-semibold uppercase tracking-wide">Starter</p>
                <h2 className="text-foreground text-2xl font-bold">Free</h2>
                <p className="text-foreground mt-3 text-4xl font-extrabold tracking-tight">
                  $0<span className="text-muted-foreground text-base font-medium">/month</span>
                </p>
              </div>

              <p className="text-muted-foreground mb-5 min-h-[48px] text-sm leading-relaxed">
                Perfect for getting started with shift and expense tracking.
              </p>

              <ul className="mb-6 flex flex-1 flex-col gap-3 text-sm">
                {["Track shifts and earnings", "Expense tracking", "Simple budgeting", "Dark mode", "Custom settings"].map(feature => (
                  <li key={feature} className="text-foreground flex items-start gap-2 break-words">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="from-primary hover:to-primary mt-auto w-full bg-gradient-to-r to-blue-500 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:from-blue-500">
                <Link href="/register">Get Started</Link>
              </Button>
              <p className="text-muted-foreground mt-3 text-center text-xs">No card required.</p>
            </Card>

            {paidPlans.map(plan => (
              <Card
                key={plan.name}
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 shadow-md transition-all duration-300 ${plan.highlighted
                  ? "border-primary/60 bg-gradient-to-br from-primary/10 via-background to-primary/5 ring-primary/20 ring-2"
                  : "border-border/80 bg-card/95"
                  }`}
              >
                <div className="bg-primary text-primary-foreground absolute right-4 top-4 inline-flex min-h-8 items-center rounded-full px-3 py-2 text-xs font-semibold leading-tight">
                  {plan.badge}
                </div>

                <div className="mb-4 pr-20">
                  <h2 className="text-foreground text-2xl font-bold">{plan.name}</h2>
                  <p className="text-foreground mt-3 text-4xl font-extrabold tracking-tight">
                    {plan.price}
                    <span className="text-muted-foreground ml-1 text-base font-medium">/month</span>
                  </p>
                </div>

                <p className="text-muted-foreground mb-5 min-h-[48px] text-sm leading-relaxed break-words">{plan.description}</p>

                <ul className="mb-6 flex flex-1 flex-col gap-3 text-sm">
                  {plan.features.map(feature => (
                    <li key={feature} className="text-foreground flex items-start gap-2 break-words">
                      <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="w-full">
                  <WaitlistButton plan={plan.name} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Dialog open={!!waitlistPlan} onOpenChange={(open) => !open && setWaitlistPlan(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join the {waitlistPlan} Waitlist</DialogTitle>
              <DialogDescription>
                We&apos;re currently finalizing our {waitlistPlan} features. Enter your email to be notified when we launch.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="waitlist-email">Email Address</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  placeholder="you@example.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  disabled={submittingWaitlist}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                className="w-full font-bold"
                onClick={handleJoinWaitlist}
                disabled={submittingWaitlist}
              >
                {submittingWaitlist ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Get Early Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PayPalScriptProvider>
    </AppShell>
  )
}

function WaitlistButton({ plan }: { plan: string }) {
  // Use a simple button as requested
  return (
    <Button
      className="w-full h-11 bg-orange-500 hover:bg-orange-600 font-bold shadow-lg shadow-orange-500/20"
      onClick={() => {
        // Trigger the parent's state change
        // Since we are in the same file, we can use a local state or ref
        const event = new CustomEvent("open-waitlist", { detail: plan })
        window.dispatchEvent(event)
      }}
    >
      Join Waitlist
    </Button>
  )
}
