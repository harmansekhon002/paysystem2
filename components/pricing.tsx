"use client"

import { useState } from "react"
import { Check, Zap, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { trackEvent } from "@/lib/analytics"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic shift tracking.",
    features: [
      "Basic shift tracking",
      "1 job / workplace",
      "Weekly hours overview",
      "Simple calendar view",
      "Mobile friendly",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "Full financial toolkit for Australian students.",
    features: [
      "Unlimited jobs & penalty rates",
      "Full salary insights & charts",
      "Budget planner with categories",
      "Savings goals tracker",
      "Public holiday auto-detection",
      "Export data (CSV)",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Student Bundle",
    price: "$2.99",
    period: "/month",
    description: "Special pricing with a valid .edu.au email.",
    features: [
      "Everything in Pro",
      "40% student discount",
      "Verified .edu.au email",
      "Study-work balance tips",
      "Community access",
    ],
    cta: "Verify Student Status",
    highlighted: false,
  },
]

export function Pricing() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null)
  const [email, setEmail] = useState("")

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan)
    setDialogOpen(true)
    trackEvent("pricing_cta_clicked", { plan: plan.name })
  }

  const handleConfirm = () => {
    if (selectedPlan) {
      trackEvent("pricing_confirmed", { plan: selectedPlan.name })
      toast({
        title: selectedPlan.name === "Free" ? "Welcome to ShiftWise!" : "Trial started!",
        description: selectedPlan.name === "Free" 
          ? "Start tracking your shifts now." 
          : `Your 14-day free trial of ${selectedPlan.name} has begun.`,
      })
      setDialogOpen(false)
      setEmail("")
    }
  }

  return (
    <div className="flex flex-col gap-12 px-4 py-16 md:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 text-sm">
          <Zap className="size-3.5" />
          Student-friendly pricing
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl text-balance">
          Simple pricing for busy students
        </h1>
        <p className="mt-3 text-muted-foreground text-pretty">
          Start tracking your shifts for free. Upgrade when you need penalty rate calculations and full budget tools.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {plans.map(plan => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${plan.highlighted ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-3 py-1">{plan.badge}</Badge>
              </div>
            )}
            <CardHeader className="flex-1">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6">
              <ul className="flex flex-col gap-2.5" role="list">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-auto w-full" variant={plan.highlighted ? "default" : "outline"} onClick={() => handleSelectPlan(plan)}>
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPlan?.name === "Free" ? "Get Started with ShiftWise" : `Start Your ${selectedPlan?.name} Trial`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-medium">{selectedPlan?.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{selectedPlan?.price}</span>
                  <span className="text-xs text-muted-foreground">{selectedPlan?.period}</span>
                </div>
              </div>
              {selectedPlan?.name !== "Free" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  No charge for 14 days. Cancel anytime during trial.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            {selectedPlan?.name === "Student Bundle" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="font-medium text-foreground">Student verification:</strong> After signing up, 
                  you&apos;ll receive an email to verify your .edu.au address to unlock the student discount.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!email.trim() || !/\S+@\S+\.\S+/.test(email)} className="gap-1.5">
              {selectedPlan?.name === "Free" ? "Get Started" : "Start Free Trial"}
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
