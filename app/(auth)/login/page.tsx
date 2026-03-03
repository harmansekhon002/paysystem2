"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Copy, Eye, EyeOff, LogIn, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [errorCode, setErrorCode] = useState("")
    const [errorDetails, setErrorDetails] = useState("")
    const [copied, setCopied] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [verificationLink, setVerificationLink] = useState("")

    function sanitizeMessage(message: string) {
        const unsafePatterns = ["prisma.", "$queryraw", "stack", "invocation:", "failed to deserialize", "to_regclass"]
        const normalized = message.toLowerCase()
        if (unsafePatterns.some(pattern => normalized.includes(pattern))) {
            return "We couldn't complete sign in due to a server/database issue. Please try again shortly."
        }
        return message.length > 180 ? `${message.slice(0, 180)}...` : message
    }

    async function handleCopyError() {
        if (!error) return
        const textToCopy = errorDetails || `${errorCode ? `[${errorCode}] ` : ""}${error}`
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setErrorCode("")
        setErrorDetails("")
        setVerificationLink("")
        setCopied(false)
        setIsLoading(true)

        try {
            const normalizedEmail = email.trim().toLowerCase()
            const precheckResponse = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail, password }),
            })

            if (!precheckResponse.ok) {
                const payload = await precheckResponse.json().catch(() => ({}))
                const code = String(payload?.code ?? `HTTP_${precheckResponse.status}`)
                const rawMessage = String(payload?.error ?? "Login failed")
                const message = sanitizeMessage(rawMessage)
                setError(message)
                setErrorCode(code)
                setErrorDetails(`Login error\nCode: ${code}\nStatus: ${precheckResponse.status}\nMessage: ${message}`)
                if (code === "EMAIL_NOT_VERIFIED") {
                    const verifyRes = await fetch("/api/auth/request-email-verification", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: normalizedEmail }),
                    })
                    const verifyData = await verifyRes.json().catch(() => ({}))
                    if (verifyData?.verificationUrl) setVerificationLink(String(verifyData.verificationUrl))
                }
                return
            }

            const result = await signIn("credentials", {
                email: normalizedEmail,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Authentication session creation failed after credential check.")
                setErrorCode(result.error)
                setErrorDetails(`Sign in error\nCode: ${result.error}\nMessage: Authentication session creation failed after credential check.`)
            } else {
                try {
                    const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" })
                    if (sessionResponse.ok) {
                        const session = await sessionResponse.json() as { user?: { isSpecialUser?: boolean } }
                        if (session.user?.isSpecialUser) {
                            sessionStorage.setItem("shiftwise:wifey-login-welcome", "1")
                        }
                    }
                } catch {
                    // Ignore non-blocking welcome marker failures.
                }
                router.push("/")
                router.refresh()
            }
        } catch (err) {
            const detail = err instanceof Error ? err.message : "Unknown client-side exception"
            setError("Login failed due to a client or network error.")
            setErrorCode("CLIENT_EXCEPTION")
            setErrorDetails(`Login error\nCode: CLIENT_EXCEPTION\nMessage: ${detail}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Error message */}
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="size-4 text-red-300" />
                                    <p className="text-sm font-semibold text-red-200">Sign in failed</p>
                                </div>
                                <p className="text-sm leading-relaxed text-red-100">{error}</p>
                                {errorCode && <p className="text-xs font-medium text-red-200/90">Error code: {errorCode}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyError}
                                className="inline-flex items-center gap-1 rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-100 hover:bg-red-500/20"
                            >
                                <Copy className="size-3.5" />
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                        {errorCode === "EMAIL_NOT_VERIFIED" && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {verificationLink ? (
                                    <a
                                        href={verificationLink}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-100 hover:bg-red-500/20"
                                    >
                                        <MailCheck className="size-3.5" />
                                        Open verification link
                                    </a>
                                ) : (
                                    <Link
                                        href="/verify-email"
                                        className="inline-flex items-center gap-1 rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-100 hover:bg-red-500/20"
                                    >
                                        <MailCheck className="size-3.5" />
                                        Verify email
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-10 rounded-xl"
                    />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">
                        Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-10 rounded-xl pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-1 h-10 w-full rounded-xl font-semibold"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <>
                            <LogIn className="size-4" />
                            Sign in
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                <Link
                    href="/forgot-password"
                    className="mb-2 inline-block font-medium text-primary hover:underline underline-offset-4"
                >
                    Forgot password?
                </Link>
                <br />
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="font-medium text-primary hover:underline underline-offset-4"
                >
                    Create one
                </Link>
            </div>
        </>
    )
}
