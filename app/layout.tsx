import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { DataProvider } from '@/components/data-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://shiftwise.vercel.app"),
  title: 'ShiftWise - Smart Shift Management for Students',
  description: 'Track shifts, manage earnings, budget smarter, and hit your savings goals. Built for students who hustle.',
  generator: 'v0.app',
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftWise",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'ShiftWise - Smart Shift Management for Students',
    description: 'Track shifts, manage earnings, budget smarter, and hit your savings goals.',
    url: '/',
    siteName: 'ShiftWise',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ShiftWise',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShiftWise - Smart Shift Management for Students',
    description: 'Track shifts, manage earnings, budget smarter, and hit your savings goals.',
    images: ['/twitter-image'],
  },
  icons: {
    icon: [
      {
        url: '/icon-wifey.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f4f8' },
    { media: '(prefers-color-scheme: dark)', color: '#131726' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <DataProvider>
                {children}
                <Toaster />
              </DataProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
