import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { DataProvider } from '@/components/data-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth-provider'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const supabaseOrigin = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    return url ? new URL(url).origin : null
  } catch {
    return null
  }
})()

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://shiftwise.vercel.app"),
  title: 'ShiftWise — Shift Tracker for International Students',
  description: 'Free shift tracker for international students. Track visa work hours, calculate penalty rates, manage budgets and hit savings goals while studying abroad.',
  generator: 'v0.app',
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftWise",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'ShiftWise — Shift Tracker for International Students',
    description: 'Free shift tracker for international students. Track visa work hours, calculate penalty rates, manage budgets and hit savings goals while studying abroad.',
    url: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://shiftwise.vercel.app"),
    siteName: 'ShiftWise',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'ShiftWise',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShiftWise — Shift Tracker for International Students',
    description: 'Free shift tracker for international students. Track visa work hours, calculate penalty rates, manage budgets and hit savings goals while studying abroad.',
    images: ['/api/og'],
  },
  icons: {
    icon: [
      {
        url: '/icon-filled.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icon-filled.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-filled.svg',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-touch-icon.png',
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
      <head>
        {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} /> : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${inter.className} font-sans antialiased text-foreground selection:bg-primary/20`}>
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
