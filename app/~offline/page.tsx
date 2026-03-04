"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
            <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
                {/* Icon */}
                <div className="flex size-20 items-center justify-center rounded-2xl bg-muted shadow-inner">
                    <WifiOff className="size-10 text-muted-foreground" />
                </div>

                {/* Heading */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        You&apos;re offline
                    </h1>
                    <p className="text-sm text-muted-foreground text-balance leading-relaxed">
                        ShiftWise needs an internet connection to sync your shifts and earnings. Check your
                        connection and try again.
                    </p>
                </div>

                {/* Retry button */}
                <Button
                    className="gap-2"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw className="size-4" />
                    Try again
                </Button>

                {/* Brand */}
                <p className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
                    ShiftWise
                </p>
            </div>
        </div>
    )
}
