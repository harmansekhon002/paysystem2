
import * as React from 'react';

export const ResetPasswordEmail = ({ resetLink }: { resetLink: string }) => (
    <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#FFFDF9',
        borderRadius: '16px',
        color: '#1a1a1a'
    }}>
        <h1 style={{ color: '#ea580c', fontSize: '24px', fontWeight: 'bold' }}>Reset your ShiftWise password</h1>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href={resetLink} style={{
                backgroundColor: '#ea580c',
                color: '#fff',
                padding: '14px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
            }}>Reset Password</a>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />
        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            © 2026 ShiftWise.
        </p>
    </div>
);
