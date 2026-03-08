
import * as React from 'react';

export const WaitlistConfirmationEmail = ({ plan }: { plan: string }) => (
    <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#FFFDF9',
        borderRadius: '16px',
        color: '#1a1a1a'
    }}>
        <h1 style={{ color: '#ea580c', fontSize: '24px', fontWeight: 'bold' }}>You're on the ShiftWise waitlist! 🎉</h1>
        <p>Thanks for your interest in the <strong>{plan}</strong> plan.</p>
        <p>We'll email you the moment it launches with an exclusive early-bird discount.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #fed7aa', margin: '20px 0' }}>
            <p style={{ margin: 0 }}>In the meantime, you can start tracking your shifts and expenses today using our free plan.</p>
        </div>
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href="https://shiftwise.vercel.app/register" style={{
                backgroundColor: '#ea580c',
                color: '#fff',
                padding: '14px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
            }}>Use Free Plan Now</a>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />
        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            © 2026 ShiftWise.
        </p>
    </div>
);
