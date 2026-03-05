"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary caught:", error)
    }, [error])

    return (
        <div className="flex min-h-svh flex-col items-center justify-center p-4 text-center bg-background">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
                <AlertCircle className="size-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-8 max-w-[400px]">
                We&apos;ve encountered an unexpected error. Our team has been notified.
                Please try refreshing the page.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.location.href = "/"} variant="outline">
                    Go Home
                </Button>
                <Button onClick={() => reset()} className="gap-2">
                    <RotateCcw className="size-4" />
                    Try Again
                </Button>
            </div>
        </div>
    )
}
