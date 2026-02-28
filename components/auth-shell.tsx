"use client"

import { useState } from "react"
import { Sun, Moon, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"

export function AuthShell({ children }: { children: React.ReactNode }) {
    const [dark, setDark] = useState(true)

    return (
        <div className={dark ? "dark" : ""}>
            <div className="relative min-h-svh flex flex-col items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
                {/* Theme toggle – top right */}
                <div className="absolute top-4 right-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDark(!dark)}
                        className="size-9 rounded-xl text-muted-foreground hover:text-foreground"
                        aria-label="Toggle theme"
                    >
                        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>
                </div>

                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
                        <Zap className="size-6 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold tracking-tight text-foreground">ShiftWise</h1>
                        <p className="text-sm text-muted-foreground">Smart shift management for students</p>
                    </div>
                </div>

                {/* Card */}
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg shadow-black/20">
                    {children}
                </div>

                {/* Footer */}
                <p className="mt-8 text-xs text-muted-foreground text-center">
                    By continuing you agree to our Terms of Service &amp; Privacy Policy.
                </p>
            </div>
            <Toaster />
        </div>
    )
}
