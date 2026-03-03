"use client"

import { useState } from "react"
import Link from "next/link"
import { Copy, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [resetUrl, setResetUrl] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setResetUrl("")
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data?.error || "Could not request password reset.")
        return
      }
      setMessage(data?.message || "If an account exists, a reset link has been sent.")
      if (data?.resetUrl) setResetUrl(data.resetUrl)
    } catch {
      setMessage("Network error while requesting reset.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email to generate a reset link.</p>
      </div>

      <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
        {message && (
          <div className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-foreground">
            {message}
            {resetUrl && (
              <div className="mt-2 flex items-center gap-2">
                <a href={resetUrl} className="text-xs text-primary underline" target="_blank" rel="noreferrer">Open reset link</a>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                  onClick={() => navigator.clipboard.writeText(resetUrl)}
                >
                  <Copy className="size-3.5" /> Copy link
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-10 rounded-xl" required />
        </div>

        <Button type="submit" disabled={loading} className="h-10 rounded-xl">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4" /> Send reset link</>}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Back to <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </div>
    </>
  )
}
