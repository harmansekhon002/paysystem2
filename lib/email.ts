
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
    to: string;
    subject: string;
    react: React.ReactElement;
    text?: string;
}

export async function sendEmail({ to, subject, react, text }: SendEmailOptions) {
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
