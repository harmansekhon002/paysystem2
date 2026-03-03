type PayPalAccessTokenResponse = {
  access_token?: string
}

type PayPalSubscriptionResponse = {
  id?: string
  plan_id?: string
  status?: string
  billing_info?: {
    next_billing_time?: string
  }
}

type PayPalWebhookVerificationResponse = {
  verification_status?: string
}

type PayPalWebhookHeaders = {
  transmissionId: string
  transmissionTime: string
  certUrl: string
  authAlgo: string
  transmissionSig: string
}

function getPayPalBaseUrl() {
  return process.env.PAYPAL_API_BASE?.trim() || "https://api-m.sandbox.paypal.com"
}

function getPayPalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim()
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim()
  return { clientId, clientSecret }
}

function assertPayPalCredentials() {
  const { clientId, clientSecret } = getPayPalCredentials()
  if (!clientId || !clientSecret) {
    throw new Error("PayPal API credentials are not configured.")
  }
  return { clientId, clientSecret }
}

export async function getPayPalAccessToken() {
  const { clientId, clientSecret } = assertPayPalCredentials()
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch PayPal access token (${response.status}).`)
  }

  const payload = (await response.json()) as PayPalAccessTokenResponse
  if (!payload.access_token) {
    throw new Error("PayPal access token response was missing an access_token.")
  }

  return payload.access_token
}

export async function fetchPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(
    `${getPayPalBaseUrl()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch PayPal subscription (${response.status}).`)
  }

  return (await response.json()) as PayPalSubscriptionResponse
}

export function getWebhookHeaders(req: Request): PayPalWebhookHeaders | null {
  const transmissionId = req.headers.get("paypal-transmission-id")?.trim() || ""
  const transmissionTime = req.headers.get("paypal-transmission-time")?.trim() || ""
  const certUrl = req.headers.get("paypal-cert-url")?.trim() || ""
  const authAlgo = req.headers.get("paypal-auth-algo")?.trim() || ""
  const transmissionSig = req.headers.get("paypal-transmission-sig")?.trim() || ""

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return null
  }

  return { transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig }
}

export async function verifyPayPalWebhookSignature(req: Request, event: unknown) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim()
  if (!webhookId) {
    throw new Error("PAYPAL_WEBHOOK_ID is not configured.")
  }

  const headers = getWebhookHeaders(req)
  if (!headers) {
    return false
  }

  const accessToken = await getPayPalAccessToken()
  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: headers.transmissionId,
      transmission_time: headers.transmissionTime,
      cert_url: headers.certUrl,
      auth_algo: headers.authAlgo,
      transmission_sig: headers.transmissionSig,
      webhook_id: webhookId,
      webhook_event: event,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Webhook signature verification failed (${response.status}).`)
  }

  const payload = (await response.json()) as PayPalWebhookVerificationResponse
  return payload.verification_status === "SUCCESS"
}
