"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, UserPlus, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: "8+ characters", ok: password.length >= 8 },
        { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
        { label: "Number", ok: /\d/.test(password) },
    ]
    if (!password) return null
    return (
        <div className="mt-1.5 flex flex-wrap gap-2">
            {checks.map((c) => (
                <span
                    key={c.label}
                    className={`flex items-center gap-1 text-xs transition-colors ${c.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`}
                >
                    <CheckCircle2 className={`size-3 ${c.ok ? "opacity-100" : "opacity-30"}`} />
                    {c.label}
                </span>
            ))}
        </div>
    )
}

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? "Registration failed")
                return
            }

            // Auto sign in after registration
            const result = await signIn("credentials", {
                email: email.trim().toLowerCase(),
                password,
                redirect: false,
            })

            if (result?.error) {
                router.push("/login")
            } else {
                router.push("/")
                router.refresh()
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h2>
                <p className="mt-1 text-sm text-muted-foreground">Start tracking your shifts today</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Error message */}
                {error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                    <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Alex Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-10 rounded-xl"
                    />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
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
                    <PasswordStrength password={password} />
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className={`h-10 rounded-xl ${confirmPassword && confirmPassword !== password
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }`}
                    />
                    {confirmPassword && confirmPassword !== password && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
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
                            <UserPlus className="size-4" />
                            Create account
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-medium text-primary hover:underline underline-offset-4"
                >
                    Sign in
                </Link>
            </div>
        </>
    )
}
