import * as React from 'react';

export const VerificationEmail = ({ name, verificationUrl }: { name: string; verificationUrl: string }) => (
    <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#FFFDF9',
        borderRadius: '16px',
        color: '#1a1a1a'
    }}>
        <h1 style={{ color: '#ea580c', fontSize: '24px', fontWeight: 'bold' }}>Verify your email 📧</h1>
        <p>Hi {name || 'there'},</p>
        <p>Thanks for signing up with ShiftWise! Please verify your email address to activate your account.</p>
        
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <a href={verificationUrl} style={{
                backgroundColor: '#ea580c',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
                fontSize: '16px'
            }}>Verify Email Address</a>
        </div>
        
        <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '12px', border: '1px solid #fed7aa', margin: '20px 0' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#9a3412' }}>
                <strong>Link expires in 24 hours</strong>
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#7c2d12' }}>
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '12px', 
                color: '#ea580c',
                wordBreak: 'break-all',
                backgroundColor: '#fff',
                padding: '8px',
                borderRadius: '6px'
            }}>
                {verificationUrl}
            </p>
        </div>
        
        <p style={{ color: '#666', fontSize: '14px', marginTop: '24px' }}>
            If you didn't create an account with ShiftWise, you can safely ignore this email.
        </p>
        
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />
        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            © 2026 ShiftWise. Built for shift workers in Australia and beyond.
        </p>
    </div>
);
