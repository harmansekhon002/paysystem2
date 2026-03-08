
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: "Privacy Policy | ShiftWise",
    description: "How we protect and manage your data at ShiftWise.",
    alternates: {
        canonical: "/privacy",
    },
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#FFFDF9] py-20">
            <div className="container mx-auto px-4 max-w-3xl">
                <Button variant="ghost" asChild className="mb-8 -ml-4 text-slate-500 hover:text-orange-600">
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft className="size-4" />
                        Back to Home
                    </Link>
                </Button>

                <article className="prose prose-slate prose-orange lg:prose-lg mx-auto">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
                    <p className="text-slate-500 font-medium mb-12">Last Updated: March 2026</p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">What data we collect</h2>
                        <p className="text-slate-600 leading-relaxed">
                            To provide the best experience, we collect and process the following information:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-2">
                            <li><strong>Account Information:</strong> Email, name, and profile settings.</li>
                            <li><strong>App Data:</strong> Shift logs, earnings, job details, and financial goals.</li>
                            <li><strong>Technical Data:</strong> Device info, browser type, and anonymous usage statistics.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">How we store your data</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Your data is stored securely in two ways:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-2">
                            <li><strong>Local Storage:</strong> Temporary data is cached on your device for offline support and speed.</li>
                            <li><strong>Cloud Storage:</strong> When synced, data is stored in our secure database hosted by Supabase.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">How we use your data</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use your data strictly to power ShiftWise features. This includes calculating earnings, providing analytics, and managing your routines.
                            <strong> We never sell your data to third parties.</strong>
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Third party services</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            We work with trusted partners to keep the app running:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                <p className="font-bold text-slate-800">Supabase</p>
                                <p className="text-sm text-slate-500">Database & Security</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                <p className="font-bold text-slate-800">PayPal</p>
                                <p className="text-sm text-slate-500">Subscription Payments</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                <p className="font-bold text-slate-800">Vercel</p>
                                <p className="text-sm text-slate-500">Hosting & Delivery</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                <p className="font-bold text-slate-800">OpenAI</p>
                                <p className="text-sm text-slate-500">AI Features</p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Data retention & deletion</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You stay in control of your data. You can delete all your records at any time by navigating to <strong>Settings → Reset All Data</strong>. This action is irreversible and permanently removes your records from our servers.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Cookies</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use essential session cookies to keep you logged in. Optional analytics cookies may be used to help us improve the app, subject to your consent.
                        </p>
                    </section>

                    <section className="mt-16 pt-10 border-t border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Contact Us</h2>
                        <p className="text-slate-600">
                            Questions about your privacy? Email us at <a href="mailto:privacy@shiftwise.app" className="text-orange-600 font-bold hover:underline">privacy@shiftwise.app</a>
                        </p>
                    </section>
                </article>
            </div>
        </div>
    )
}
