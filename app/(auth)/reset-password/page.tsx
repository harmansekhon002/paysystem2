"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const mismatch = useMemo(() => confirmPassword.length > 0 && password !== confirmPassword, [password, confirmPassword])

  useEffect(() => {
    const tokenFromQuery = new URLSearchParams(window.location.search).get("token") || ""
    if (tokenFromQuery) setToken(tokenFromQuery)
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (mismatch) return
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      setMessage(data?.message || data?.error || "Password reset response received.")
    } catch {
      setMessage("Network error while resetting password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleReset} className="flex flex-col gap-4">
        {message && <div className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground">{message}</div>}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" value={token} onChange={e => setToken(e.target.value)} className="h-10 rounded-xl" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-10 rounded-xl pr-10"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="h-10 rounded-xl"
            required
          />
          {mismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
        </div>

        <Button type="submit" disabled={loading || mismatch} className="h-10 rounded-xl">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <><KeyRound className="size-4" /> Update password</>}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Back to <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </div>
    </>
  )
}
