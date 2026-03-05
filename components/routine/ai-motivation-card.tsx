"use client"

import { useEffect, useState } from "react"
import { Sparkles, RefreshCw, BrainCircuit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AIMotivationCardProps {
    context: {
        recentEarnings: number
        goalStatus: string
        mood: string
        isSpecialUser: boolean
    }
}

export function AIMotivationCard({ context }: AIMotivationCardProps) {
    const [nudge, setNudge] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const fetchNudge = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                body: JSON.stringify({
                    messages: [
                        { role: "user", content: "Give me a personalized motivational nudge based on my current state." }
                    ],
                    context
                }),
            })

            if (response.ok) {
                // Handle streaming or just get the full text for simplicity in this card
                const reader = response.body?.getReader()
                const decoder = new TextDecoder()
                let result = ""
                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        const chunk = decoder.decode(value, { stream: true })
                        // The result usually comes in a specific format from Vercel AI SDK (e.g., 0:"text")
                        // For a simple nudge, we'll just try to extract the text part
                        const textParts = chunk.match(/0:"([^"]+)"/g)
                        if (textParts) {
                            textParts.forEach(part => {
                                const text = part.match(/:"([^"]+)"/)?.[1]
                                if (text) result += text.replace(/\\n/g, '\n')
                            })
                        } else if (chunk.startsWith('0:')) {
                            // Fallback for different stream formats
                            result += chunk.split('"')[1] || ""
                        }
                        setNudge(result)
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch AI nudge:", error)
            setNudge("You're doing great! Keep pushing towards your goals. 🚀")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNudge()
    }, [])

    return (
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-premium">
            <div className="absolute -right-4 -top-4 size-24 bg-primary/10 blur-3xl" />
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-semibold tracking-tight">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <Sparkles className="size-4 text-primary animate-pulse" />
                        </div>
                        AI Motivation
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-primary transition-transform hover:rotate-180 duration-500"
                        onClick={fetchNudge}
                        disabled={loading}
                    >
                        <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading && !nudge ? (
                    <div className="flex flex-col gap-2 py-2">
                        <div className="h-4 w-full animate-pulse rounded bg-primary/5" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-primary/5" />
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed text-foreground/90 italic">
                        "{nudge || "Thinking of something motivating for you..."}"
                    </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                        <div className="size-5 rounded-full bg-orange-500/10 flex items-center justify-center border border-background">
                            <BrainCircuit className="size-3 text-orange-500" />
                        </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Powered by ShiftWise AI</span>
                </div>
            </CardContent>
        </Card>
    )
}
