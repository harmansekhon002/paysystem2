import { AppShell } from "@/components/app-shell"

export default function TermsPage() {
    return (
        <AppShell>
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                <div className="prose prose-sm dark:prose-invert">
                    <p className="mb-4">Last updated: March 04, 2026</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing and using ShiftWise, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
                    <p>ShiftWise is a tool designed to help students track shifts, earnings, and manage budgets. We reserve the right to modify or discontinue the service at any time.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Subscriptions and Payments</h2>
                    <p>Payments for premium features are processed through PayPal. All payments are subject to PayPal's terms and conditions. Subscriptions can be managed and cancelled through the app's settings.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
                    <p>ShiftWise is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">6. Changes to Terms</h2>
                    <p>We may update these terms from time to time. Your continued use of the service after any changes indicates your acceptance of the new terms.</p>
                </div>
            </div>
        </AppShell>
    )
}
