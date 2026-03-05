"use client"

import { Inter } from "next/font/google"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

const inter = Inter({ subsets: ["latin"] })

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    console.error(error);
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="flex min-h-svh flex-col items-center justify-center p-4 text-center bg-background text-foreground">
                    <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
                        <AlertCircle className="size-8 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Critical Application Error</h2>
                    <p className="text-muted-foreground mb-8 max-w-[400px]">
                        We&apos;ve encountered a critical error that prevented the application from loading.
                        Our engineering team has been notified of the issue.
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.href = "/"} variant="outline">
                            Return Home
                        </Button>
                        <Button onClick={() => reset()} className="gap-2">
                            <RotateCcw className="size-4" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    )
}
