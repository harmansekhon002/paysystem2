
import * as React from 'react';

export const WelcomeEmail = ({ name }: { name: string }) => (
    <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#FFFDF9',
        borderRadius: '16px',
        color: '#1a1a1a'
    }}>
        <h1 style={{ color: '#ea580c', fontSize: '24px', fontWeight: 'bold' }}>Welcome to ShiftWise 👋</h1>
        <p>Hi {name || 'there'},</p>
        <p>We're thrilled to have you join ShiftWise — the smart companion for shift workers.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #fed7aa', margin: '20px 0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>3 Quick Steps to Start:</h3>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
                <li><strong>Add a workplace:</strong> Set your hourly rate.</li>
                <li><strong>Log your first shift:</strong> Track your earnings.</li>
                <li><strong>Set a savings goal:</strong> Hit your targets faster.</li>
            </ol>
        </div>
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href="https://shiftwise.vercel.app/dashboard" style={{
                backgroundColor: '#ea580c',
                color: '#fff',
                padding: '14px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
            }}>Go to Dashboard</a>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
            Want more features? <a href="https://shiftwise.vercel.app/pricing" style={{ color: '#ea580c' }}>Check our pricing plans</a>.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />
        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            © 2026 ShiftWise. Built for shift workers in Australia and beyond.
        </p>
    </div>
);
