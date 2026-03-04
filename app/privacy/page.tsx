import { AppShell } from "@/components/app-shell"

export default function PrivacyPage() {
    return (
        <AppShell>
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-sm dark:prose-invert">
                    <p className="mb-4">Last updated: March 04, 2026</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Data Collection</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, log shifts, or set savings goals. This include your name, email address, and financial data related to your shifts and budgets.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. Use of Data</h2>
                    <p>We use your data to provide, maintain, and improve ShiftWise features, to process transactions, and to communicate with you about your account.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Sharing</h2>
                    <p>We do not sell your personal data. We may share data with third-party service providers like PayPal to process payments, or as required by law.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Security</h2>
                    <p>We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, or destruction.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Your Choices</h2>
                    <p>You can access and update your account information at any time through the app settings. You can also delete your account, which will remove your data from our active systems.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">6. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us through the app feedback or support channels.</p>
                </div>
            </div>
        </AppShell>
    )
}
