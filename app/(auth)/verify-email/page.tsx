"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, MailCheck, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VerifyEmailPage() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function verifyEmail(verificationToken: string) {
    setLoading(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setMessage(data?.error || "Email verification failed.")
      } else {
        setStatus("success")
        setMessage(data?.message || "Email verified successfully.")
      }
    } catch {
      setStatus("error")
      setMessage("Network error while verifying email.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const tokenFromQuery = new URLSearchParams(window.location.search).get("token") || ""
    if (tokenFromQuery) {
      setToken(tokenFromQuery)
      void verifyEmail(tokenFromQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Verify your email</h2>
        <p className="mt-1 text-sm text-muted-foreground">Confirm your account to complete sign in setup.</p>
      </div>

      <div className="flex flex-col gap-4">
        {status === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="size-4" /> Verified
            </div>
            <p className="mt-1">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <div className="flex items-center gap-2 font-semibold">
              <TriangleAlert className="size-4" /> Verification failed
            </div>
            <p className="mt-1">{message}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="verify-token">Verification token</Label>
          <Input
            id="verify-token"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste verification token"
            className="h-10 rounded-xl"
          />
        </div>

        <Button onClick={() => verifyEmail(token)} disabled={!token || loading} className="h-10 rounded-xl">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <><MailCheck className="size-4" /> Verify email</>}
        </Button>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Back to <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </div>
    </>
  )
}
