"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Menu,
    X,
    ArrowRight,
    Check,
    CalendarClock,
    TrendingUp,
    ShieldCheck,
    Zap,
    Smartphone,
    Target,
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Script from "next/script"

export default function LandingPage() {
    const { status } = useSession()
    const router = useRouter()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "ShiftWise",
        description: "Shift tracking app for international students working abroad",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, iOS, Android",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "Is ShiftWise free?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, ShiftWise has a free plan with core shift tracking, expense tracking and basic budgeting. Paid plans unlock advanced analytics, unlimited goals and CSV exports.",
                },
            },
            {
                "@type": "Question",
                name: "Which countries does ShiftWise work in?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "ShiftWise works for international students in any western country. The Visa Guardian feature supports work hour limits for students in the USA, Canada, Australia, UK, Germany and other western countries.",
                },
            },
            {
                "@type": "Question",
                name: "Does ShiftWise work offline?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, ShiftWise is a Progressive Web App that works fully offline. Your data syncs automatically when you reconnect to the internet.",
                },
            },
            {
                "@type": "Question",
                name: "How does the Visa Guardian work?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "You set your visa work hour limit and cycle length in settings. ShiftWise automatically tracks your logged hours against that limit and shows you how many hours you have remaining in real time.",
                },
            },
        ],
    }

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard")
        }
    }, [status, router])

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    if (status === "authenticated") {
        return null
    }

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <Script id="ld-webapp" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <Script id="ld-faq" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            {/* Header */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                    isScrolled
                        ? "bg-background/90 backdrop-blur-md border-border py-3 shadow-sm"
                        : "bg-transparent border-transparent py-5"
                )}
            >
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-md">
                            <Zap className="size-5 text-white" fill="white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">ShiftWise</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
                        <Link href="#features" className="hover:text-orange-600 transition-colors">Features</Link>
                        <Link href="#how-it-works" className="hover:text-orange-600 transition-colors">How it Works</Link>
                        <Link href="/pricing" className="hover:text-orange-600 transition-colors">Pricing</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" asChild className="font-bold text-muted-foreground">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild className="bg-orange-600 hover:bg-orange-700 font-bold px-6 shadow-lg shadow-orange-600/20">
                            <Link href="/register">Get Started Free</Link>
                        </Button>
                    </div>

                    <button
                        className="md:hidden p-2 text-muted-foreground"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-4 shadow-xl animate-in slide-in-from-top duration-200">
                        <nav className="flex flex-col gap-4 text-center">
                            <Link href="#features" className="py-2 text-muted-foreground font-bold" onClick={() => setMobileMenuOpen(false)}>Features</Link>
                            <Link href="#how-it-works" className="py-2 text-muted-foreground font-bold" onClick={() => setMobileMenuOpen(false)}>How it Works</Link>
                            <Link href="/pricing" className="py-2 text-muted-foreground font-bold" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                            <hr className="border-border" />
                            <div className="flex flex-col gap-3 py-2">
                                <Button variant="outline" asChild className="w-full font-bold">
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 font-bold">
                                    <Link href="/register">Get Started Free</Link>
                                </Button>
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-gradient-to-b from-orange-50/20 to-background overflow-hidden dark:from-orange-950/10">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
                            Track Shifts. Stay Visa Compliant. Build Savings.
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                            The only shift tracking app built specifically for international students working abroad. Automatic earnings calculations, real-time visa hour tracking, and wellness tools — all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <Button size="lg" asChild className="h-14 px-8 text-lg bg-orange-600 hover:bg-orange-700 font-bold w-full sm:w-auto shadow-xl shadow-orange-600/25 active:scale-95 transition-all">
                                <Link href="/register">Get Started Free</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg font-bold w-full sm:w-auto border-orange-200 hover:bg-orange-50 transition-all">
                                <Link href="/pricing">See Pricing</Link>
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
                            <span className="uppercase tracking-[0.18em] text-xs text-orange-600">Trusted by international students in</span>
                            <span className="text-lg">🇺🇸</span>
                            <span className="text-lg">🇦🇺</span>
                            <span className="text-lg">🇨🇦</span>
                            <span className="text-lg">🇬🇧</span>
                            <span className="text-lg">🇩🇪</span>
                        </div>

                        {/* Mockup Placeholder */}
                        <div className="relative mx-auto mt-12 max-w-5xl group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden aspect-[16/10] flex items-stretch">
                                {/* Side Nav Mockup */}
                                <div className="hidden md:flex w-20 border-r border-border flex-col py-6 items-center gap-6 bg-muted/30">
                                    <div className="size-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center dark:bg-orange-900/30 dark:text-orange-400"><Zap className="size-4" /></div>
                                    <div className="size-8 rounded-lg bg-card shadow-sm flex items-center justify-center text-muted-foreground"><Clock className="size-4" /></div>
                                    <div className="size-8 rounded-lg bg-card shadow-sm flex items-center justify-center text-muted-foreground"><TrendingUp className="size-4" /></div>
                                </div>
                                {/* Main Content Mockup */}
                                <div className="flex-1 p-8 text-left bg-gradient-to-br from-card via-card to-orange-50/5 dark:to-orange-900/5">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="space-y-1">
                                            <div className="h-4 w-32 bg-slate-100 rounded"></div>
                                            <div className="h-8 w-48 bg-slate-900 rounded-lg"></div>
                                        </div>
                                        <div className="size-10 rounded-full bg-slate-100"></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 mb-8">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3">
                                                <div className="size-6 rounded-lg bg-orange-50"></div>
                                                <div className="space-y-1">
                                                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                                    <div className="h-5 w-24 bg-slate-900 rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-48 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 relative">
                                        <div className="flex gap-4 items-end h-full">
                                            {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                                                <div key={i} className="flex-1 bg-orange-500/10 rounded-t-lg relative group transition-all" style={{ height: `${h}%` }}>
                                                    <div className="absolute inset-x-0 bottom-0 bg-orange-500 rounded-t-lg h-2/3 opacity-80"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Powerful tools for heavy hitters.</h2>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">Everything you need to track your labor, earnings and financial health in one unified place.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<CalendarClock className="size-6" />}
                            title="Shift Tracking"
                            description="Log shifts in seconds with automatic penalty rate calculations for weekends, public holidays, and overtime"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="size-6" />}
                            title="Earnings Analytics"
                            description="See exactly what you earn by job, rate type and time period with beautiful charts and trend forecasting"
                        />
                        <FeatureCard
                            icon={<Target className="size-6" />}
                            title="Budget & Goals"
                            description="Set savings targets, track spending by category and get AI recovery plans when you fall behind"
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="size-6" />}
                            title="Visa Guardian"
                            description="Stay within your student visa work hour limit with real-time tracking and automatic alerts — works for all major western countries"
                        />
                        <FeatureCard
                            icon={<Zap className="size-6" />}
                            title="Wellness Routine"
                            description="Daily hydration, sleep, mood and habit tracking to keep you performing at your best"
                        />
                        <FeatureCard
                            icon={<Smartphone className="size-6" />}
                            title="Works Offline"
                            description="Install as an app on any device. Your data stays safe and syncs automatically when you're back online"
                        />
                    </div>
                </div>
            </section>

            {/* Works for your visa */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Works for your visa.</h2>
                        <p className="text-lg text-muted-foreground">
                            Pick your visa type and ShiftWise will track your hours against the correct cap while you study abroad.
                        </p>
                    </div>
                    <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: "F-1 (USA)", detail: "20 hours per week on-campus during term; authorisation needed off-campus" },
                            { title: "Study Permit (Canada)", detail: "20 hours per week during study periods; full-time in scheduled breaks" },
                            { title: "Student Visa (Australia)", detail: "48 hours per fortnight during study terms; unlimited in breaks" },
                            { title: "Tier 4 / Student Route (UK)", detail: "20 hours per week during term across on-campus and paid roles" },
                            { title: "Student Visa (Germany/Europe)", detail: "120 full days or 240 half days per year across most paid work" },
                        ].map((item) => (
                            <div key={item.title} className="rounded-2xl border border-border/80 bg-muted/20 p-5 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 rounded-full bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                                        <Check className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        Limits change — always verify with your official visa authority.
                    </p>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-24 bg-muted/50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Be up and running in minutes.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-border border-dashed border-t-2"></div>

                        <Step
                            num="1"
                            title="Create your free account"
                            description="Sign up in under 60 seconds with just your email."
                        />
                        <Step
                            num="2"
                            title="Add your workplace and rate"
                            description="Set your hourly rate and job details once — we do the rest."
                        />
                        <Step
                            num="3"
                            title="Log shifts and watch savings grow"
                            description="Track earnings and hit your financial goals automatically."
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-24 bg-background overflow-hidden">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Trusted by students studying abroad.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Testimonial
                            name="Jamie"
                            role="Retail · studying abroad in London"
                            initials="JW"
                            quote="Finally an app that actually understands penalty rates. Saved me hours every pay period."
                        />
                        <Testimonial
                            name="Priya"
                            role="Hospitality · studying abroad"
                            initials="PR"
                            quote="The visa hour tracker is exactly what I needed as an international student. Total peace of mind."
                        />
                        <Testimonial
                            name="Marcus"
                            role="Warehouse · student in Berlin"
                            initials="MA"
                            quote="Set a goal to save for a car. Hit it in 4 months using the budget tools. Genuinely changed how I manage money."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Preview */}
            <section className="py-24 bg-slate-900 text-white rounded-[3rem] mx-4 md:mx-10 mb-20 shadow-2xl shadow-slate-900/40">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Pricing that works for you.</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Start with the essentials and upgrade only when you need deeper insights.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <PriceCard name="Starter" price="Free" description="Perfect for tracking the essentials." />
                        <PriceCard name="Plus" price="$2.50" description="Deeper earnings analysis for busy workers." spotlight />
                        <PriceCard name="Pro" price="$5" description="Ultimate financial control and AI forecasting." />
                    </div>

                    <div className="text-center mt-12">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-orange-400 font-bold hover:text-orange-300 transition-colors">
                            See full plan details <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-orange-600">
                                    <Zap className="size-4 text-white" fill="white" />
                                </div>
                                <span className="text-lg font-bold tracking-tight text-foreground">ShiftWise</span>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                The smart companion for shift workers. Maximise your pay, track your time, and reach your goals.
                            </p>
                            <p className="text-muted-foreground/60 text-xs font-semibold uppercase tracking-wider">
                                Built for international students working abroad
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-foreground mb-6 uppercase text-xs tracking-[0.2em]">Product</h4>
                            <ul className="space-y-4 text-sm text-muted-foreground">
                                <li><Link href="#features" className="hover:text-orange-600 transition-colors">Features</Link></li>
                                <li><Link href="/pricing" className="hover:text-orange-600 transition-colors">Pricing</Link></li>
                                <li><Link href="/register" className="hover:text-orange-600 transition-colors">Get Started</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-foreground mb-6 uppercase text-xs tracking-[0.2em]">Support</h4>
                            <ul className="space-y-4 text-sm text-muted-foreground">
                                <li><Link href="/login" className="hover:text-orange-600 transition-colors">Sign In</Link></li>
                                <li><Link href="/privacy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-orange-600 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-muted-foreground/60 text-sm italic">
                            Empowering shift workers one pay period at a time.
                        </p>
                        <p className="text-muted-foreground text-sm font-medium">
                            © 2026 ShiftWise. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="group hover:border-orange-200 hover:shadow-xl hover:shadow-orange-600/5 transition-all duration-300 border-border rounded-3xl p-4">
            <CardContent className="pt-6">
                <div className="size-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300 dark:bg-orange-950/30 dark:text-orange-400">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    )
}

function Step({ num, title, description }: { num: string, title: string, description: string }) {
    return (
        <div className="text-center relative z-10">
            <div className="size-20 rounded-full bg-card border-2 border-border shadow-xl flex items-center justify-center mx-auto mb-8 font-extrabold text-2xl text-orange-600">
                {num}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4">{title}</h3>
            <p className="text-foreground/70 max-w-[240px] mx-auto leading-relaxed">{description}</p>
        </div>
    )
}

function Testimonial({ name, role, initials, quote }: { name: string, role: string, initials: string, quote: string }) {
    return (
        <div className="bg-muted/30 p-8 rounded-[2.5rem] border border-border hover:border-orange-100 transition-colors duration-300">
            <div className="flex items-center gap-1 text-orange-400 mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className="size-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
            <p className="text-foreground/80 font-medium italic mb-8 leading-relaxed">"{quote}"</p>
            <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs dark:bg-orange-900/40 dark:text-orange-400">
                    {initials}
                </div>
                <div>
                    <h4 className="font-bold text-foreground text-sm">{name}</h4>
                    <p className="text-muted-foreground/60 text-xs font-semibold uppercase">{role}</p>
                </div>
            </div>
        </div>
    )
}

function PriceCard({ name, price, description, spotlight = false }: { name: string, price: string, description: string, spotlight?: boolean }) {
    return (
        <div
            className={cn(
                "p-8 rounded-[2rem] border transition-all duration-300",
                spotlight
                    ? "bg-orange-600 border-orange-500 shadow-2xl shadow-orange-600/20 scale-105"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
            )}
        >
            <h3 className={cn("font-bold uppercase text-xs tracking-widest mb-2", spotlight ? "text-orange-200" : "text-slate-400")}>\
                {name}
            </h3>
            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold">{price}</span>
                {price !== "Free" && <span className={cn("text-xs font-medium", spotlight ? "text-orange-200" : "text-slate-400")}>/month</span>}
            </div>
            <p className={cn("text-sm leading-relaxed mb-8", spotlight ? "text-orange-50" : "text-slate-400")}>
                {description}
            </p>
            <Link href="/register" className={cn(
                "block text-center py-3 rounded-xl font-bold text-sm transition-all",
                spotlight
                    ? "bg-white text-orange-600 hover:bg-orange-50"
                    : "bg-slate-700 text-white hover:bg-slate-600"
            )}>
                Get Started
            </Link>
        </div>
    )
}
