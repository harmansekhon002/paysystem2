
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: "Terms of Service | ShiftWise",
    description: "The rules and agreements for using ShiftWise.",
    alternates: {
        canonical: "/terms",
    },
}

export default function TermsPage() {
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
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Terms of Service</h1>
                    <p className="text-slate-500 font-medium mb-12">Last Updated: March 2026</p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-slate-600 leading-relaxed">
                            By accessing or using ShiftWise, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Description of Service</h2>
                        <p className="text-slate-600 leading-relaxed font-bold">
                            ShiftWise is a tool designed to help you track shifts, earnings, and financial goals. It does NOT provide financial, legal, or visa advice.
                        </p>
                        <p className="text-slate-600 leading-relaxed mt-2">
                            All calculations (including penalty rates) are estimates and should be verified against your official pay slips.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. User Responsibilities</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You are responsible for maintaining the security of your account and for all activities that occur under your account. You must provide accurate and complete information when using the service.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Subscriptions & Payments</h2>
                        <p className="text-slate-600 leading-relaxed">
                            ShiftWise offers Free, Plus, and Pro plans. Subscriptions are billed monthly and can be canceled at any time.
                        </p>
                        <p className="text-slate-600 leading-relaxed mt-2 border-l-4 border-orange-200 pl-4 py-2 bg-orange-50/30">
                            <strong>Refund Policy:</strong> We offer pro-rata refunds within 14 days of your initial subscription or renewal if you are unsatisfied with the service.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Intellectual Property</h2>
                        <p className="text-slate-600 leading-relaxed">
                            The service and its original content, features, and functionality are and will remain the exclusive property of ShiftWise and its licensors.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Disclaimer of Warranties</h2>
                        <p className="text-slate-600 leading-relaxed italic">
                            The service is provided on an "AS IS" and "AS AVAILABLE" basis. ShiftWise is not responsible for any visa compliance decisions or financial errors made based on information presented in the app.
                        </p>
                        <p className="text-slate-600 leading-relaxed mt-2">
                            <strong>The Visa Guardian feature is for informational purposes only.</strong> Always consult official government guidelines or a migration agent for visa compliance.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Limitation of Liability</h2>
                        <p className="text-slate-600 leading-relaxed">
                            In no event shall ShiftWise be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the service.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Governing Law</h2>
                        <p className="text-slate-600 leading-relaxed">
                            These terms shall be governed by the laws of <strong>Victoria, Australia</strong>, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section className="mt-16 pt-10 border-t border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Legal Contact</h2>
                        <p className="text-slate-600">
                            Questions about these terms? Email us at <a href="mailto:legal@shiftwise.app" className="text-orange-600 font-bold hover:underline">legal@shiftwise.app</a>
                        </p>
                    </section>
                </article>
            </div>
        </div>
    )
}
