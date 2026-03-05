import { AppShell } from "@/components/app-shell"

export default function PrivacyPage() {
    return (
        <AppShell>
            <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-sm dark:prose-invert">
                    <p className="mb-4">Last updated: March 04, 2026</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
                    <p>When you use ShiftWise (&quot;the Service&quot;), we collect information that helps us provide and improve our tracking and financial tools. This includes:</p>
                    <ul className="list-disc pl-5 my-4">
                        <li><strong>Account Information:</strong> Name, email address, and authentication data.</li>
                        <li><strong>Financial & Operational Data:</strong> Shift times, hourly rates, calculated earnings, budgets, expenses, and savings goals you input into the Service. We do not connect to your bank accounts directly.</li>
                        <li><strong>Device & Usage Data:</strong> Interacting with our Service automatically provides us with certain data (e.g., IP address, browser type, device identifiers) essential for analytics and security tracking.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Information</h2>
                    <p>We use your information strictly to operate the Service. This includes:</p>
                    <ul className="list-disc pl-5 my-4">
                        <li>Providing core features like shift penalty calculations and budget tracking.</li>
                        <li>Syncing your data across devices using secure, authenticated pathways.</li>
                        <li>Detecting and preventing fraudulent activity or security breaches.</li>
                        <li>Communicating updates, support responses, and service announcements.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Sharing & Third Parties</h2>
                    <p>We do not sell or rent your personal data to third parties. We may share information with trusted service providers who assist us in operating our Service, such as:</p>
                    <ul className="list-disc pl-5 my-4">
                        <li><strong>Database Providers:</strong> Hosting your data securely (e.g., PostgreSQL hosting).</li>
                        <li><strong>Payment Processors:</strong> We use PayPal to process subscriptions. We do not store your full credit card information.</li>
                        <li><strong>Email Providers:</strong> To send you transactional and support emails.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Security & Storage</h2>
                    <p>We employ operational, technical, and physical safeguards designed to protect the information we collect. Financial data is transmitted over encrypted connections (HTTPS) and stored in secured environments. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">5. Your Privacy Rights</h2>
                    <p>Depending on your location, you may have rights regarding your personal information, such as the right to access, correct, or request deletion of your data. You may delete your account and associated synced data directly from the ShiftWise application settings or by contacting support.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">6. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy periodically. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Continued use of the Service implies your acceptance of the revised policy.</p>

                    <h2 className="text-xl font-semibold mt-8 mb-4">7. Contact Us</h2>
                    <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at support@shiftwise.app.</p>
                </div>
            </div>
        </AppShell>
    )
}
