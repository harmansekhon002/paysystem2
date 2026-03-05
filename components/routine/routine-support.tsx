"use client"

import { LifeBuoy, Share } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type RoutineState } from "./routine-types"

const SUPPORT_TEMPLATES = [
    {
        id: "general",
        label: "General support",
        body: "I need support right now. Please check in with me.",
    },
    {
        id: "overwhelmed",
        label: "Feeling overwhelmed",
        body: "I feel overwhelmed right now. Please help me reset gently.",
    },
    {
        id: "reassurance",
        label: "Need reassurance",
        body: "I need reassurance and a calm check-in from you right now.",
    },
]

interface RoutineSupportProps {
    sendSupportPing: (template?: { label: string; body: string }) => void
    supportState: string
    isMobile: boolean
    parentalMode: boolean
    whatsappNumber: string
    isSpecialUser: boolean
}

export function RoutineSupport({
    sendSupportPing,
    supportState,
    isMobile,
    parentalMode,
    whatsappNumber,
    isSpecialUser,
}: RoutineSupportProps) {
    return (
        <Card className="border-primary/25">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <LifeBuoy className="size-4 text-primary" />
                    {parentalMode ? (isMobile ? "Parent Help" : "Parent Support + Emergency") : (isMobile ? "Support" : "Partner Reassurance + Emergency")}
                </CardTitle>
                {!isMobile ? (
                    <CardDescription>
                        {parentalMode
                            ? "One place for parent support requests and urgent help templates."
                            : "One place for support ping plus urgent reassurance templates."}
                    </CardDescription>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {!isMobile ? <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick support</p> : null}
                    <Button onClick={() => void sendSupportPing()} className="w-full sm:w-fit">
                        {isMobile ? "Request support" : parentalMode ? "Need parent support now" : "I need support now"}
                    </Button>
                </div>

                {!isMobile ? (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency templates</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {SUPPORT_TEMPLATES
                                .filter((template) => template.id !== "general")
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map((template) => (
                                    <Button
                                        key={template.id}
                                        variant="outline"
                                        className="w-full justify-start text-left"
                                        onClick={() => void sendSupportPing(template)}
                                    >
                                        {template.label}
                                    </Button>
                                ))}
                        </div>
                    </div>
                ) : (
                    <details className="rounded-md border border-border/60 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Emergency templates
                        </summary>
                        <div className="mt-2 grid gap-2">
                            {SUPPORT_TEMPLATES
                                .filter((template) => template.id !== "general")
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map((template) => (
                                    <Button
                                        key={template.id}
                                        variant="outline"
                                        className="w-full justify-start text-left"
                                        onClick={() => void sendSupportPing(template)}
                                    >
                                        {template.label}
                                    </Button>
                                ))}
                        </div>
                    </details>
                )}

                {supportState && !isMobile ? <p className="text-xs text-muted-foreground">{supportState}</p> : null}
                {isSpecialUser && !whatsappNumber && !isMobile ? (
                    <p className="text-[11px] text-muted-foreground">
                        Tip: add guardian WhatsApp number in Settings for direct one-tap send.
                    </p>
                ) : null}
            </CardContent>
        </Card>
    )
}
