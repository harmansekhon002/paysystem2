"use client"

import { useState, useEffect } from "react"
import { Shield, Fingerprint, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Helper to encode/decode Uint8Array
const base64UrlEncode = (buffer: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "")
}

interface BiometricPromptProps {
    onSuccess: () => void
    userId: string
    userName: string
}

export function BiometricPrompt({ onSuccess, userId, userName }: BiometricPromptProps) {
    const [isSupported, setIsSupported] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if WebAuthn is supported
        if (window.PublicKeyCredential) {
            setIsSupported(true)
            // Check if we already have a credential ID stored for this user
            const storedCredId = localStorage.getItem(`shiftwise:webauthn-cred-${userId}`)
            if (storedCredId) {
                setIsEnrolled(true)
            }
        }
    }, [userId])

    const registerBiometrics = async () => {
        try {
            setLoading(true)
            setError(null)

            const userIdBuffer = new TextEncoder().encode(userId)

            const createCredentialDefaultArgs: PublicKeyCredentialCreationOptions = {
                rp: {
                    name: "ShiftWise Companion",
                    id: window.location.hostname
                },
                user: {
                    id: userIdBuffer,
                    name: userName,
                    displayName: userName,
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }, // ES256
                    { type: "public-key", alg: -257 } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Force on-device (FaceID/TouchID)
                    userVerification: "required",
                    requireResidentKey: false
                },
                timeout: 60000,
                challenge: window.crypto.getRandomValues(new Uint8Array(32))
            }

            const credential = await navigator.credentials.create({
                publicKey: createCredentialDefaultArgs
            }) as PublicKeyCredential

            if (credential) {
                // Store the raw id for future assertions
                const credIdRaw = base64UrlEncode(credential.rawId)
                localStorage.setItem(`shiftwise:webauthn-cred-${userId}`, credIdRaw)
                setIsEnrolled(true)
            }
        } catch (err: unknown) {
            console.error(err)
            if (err instanceof Error && err.name !== "NotAllowedError") {
                setError(err.message || "Failed to register biometrics.")
            }
        } finally {
            setLoading(false)
        }
    }

    const authenticateBiometrics = async () => {
        try {
            setLoading(true)
            setError(null)

            const storedCredId = localStorage.getItem(`shiftwise:webauthn-cred-${userId}`)
            if (!storedCredId) throw new Error("No credential found.")

            const getCredentialDefaultArgs: PublicKeyCredentialRequestOptions = {
                challenge: window.crypto.getRandomValues(new Uint8Array(32)),
                rpId: window.location.hostname,
                userVerification: "required",
                timeout: 60000,
            }

            const credential = await navigator.credentials.get({
                publicKey: getCredentialDefaultArgs
            })

            if (credential) {
                onSuccess()
            }
        } catch (err: unknown) {
            console.error(err)
            if (err instanceof Error && err.name !== "NotAllowedError") {
                setError("Authentication failed.")
            }
        } finally {
            setLoading(false)
        }
    }

    if (!isSupported) return null

    return (
        <div className="flex flex-col items-center gap-4 py-4 w-full">
            {isEnrolled ? (
                <Button
                    variant="secondary"
                    size="lg"
                    className="w-full gap-2 h-14 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                    onClick={authenticateBiometrics}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Fingerprint className="size-6 text-primary" />}
                    <span>Unlock with Face ID / Touch ID</span>
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={registerBiometrics}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin size-4" /> : <Shield className="size-4" />}
                    Setup Biometric Unlock
                </Button>
            )}
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>
    )
}
