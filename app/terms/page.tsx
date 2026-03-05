import { AppShell } from "@/components/app-shell"

export default function TermsPage() {
    return (
        <AppShell>
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                <div className="prose prose-sm dark:prose-invert">
                    <p className="mb-4">Last updated: March 04, 2026</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing and using ShiftWise (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service. We reserve the right to update these terms at any time, and your continued use constitutes acceptance of those changes.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
                    <p>ShiftWise is a personal finance and shift-tracking application designed to help users track working hours, calculate projected earnings, and manage personal budgets. The application is provided for informational and tracking purposes only and does not constitute financial, legal, or tax advice.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts & Responsibilities</h2>
                    <p>You must provide accurate information when creating an account. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Subscriptions, Payments & Refunds</h2>
                    <p>Certain features of the Service are offered via a paid premium subscription. Payments are processed securely via third-party processors (e.g., PayPal). By subscribing, you agree to auto-renewing billing unless canceled prior to the renewal date. All payments are non-refundable unless required by applicable law.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
                    <p>The Service, including its original content, features, and functionality, are and will remain the exclusive property of ShiftWise and its licensors. You may not reproduce, distribute, or create derivative works from the Service without explicit permission.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
                    <p>To the maximum extent permitted by law, ShiftWise shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Service; (b) any conduct or content of any third party on the Service.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">7. Termination</h2>
                    <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">8. Contact Us</h2>
                    <p>If you have any questions about these Terms, please contact us at support@shiftwise.app.</p>
                </div>
            </div>
        </AppShell>
    )
}
