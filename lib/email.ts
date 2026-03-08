
import { Resend } from 'resend';

interface SendEmailOptions {
    to: string;
    subject: string;
    react: React.ReactElement;
    text?: string;
}

export async function sendEmail({ to, subject, react, text }: SendEmailOptions) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        // Email is optional in some environments (build preview/local). Skip safely.
        return { success: false, error: "RESEND_API_KEY is not configured" }
    }

    const resend = new Resend(apiKey)

    try {
        const data = await resend.emails.send({
            from: 'ShiftWise <hello@shiftwise.app>',
            to,
            subject,
            react,
            text: text || '',
        });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
