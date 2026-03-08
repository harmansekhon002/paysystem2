import { ImageResponse } from "next/og"

export const runtime = "edge"

const size = {
  width: 1200,
  height: 630,
}

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
          color: "white",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          padding: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <h1
            style={{
              fontSize: "80px",
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.05em",
            }}
          >
            ShiftWise
          </h1>
        </div>
        <p
          style={{
            fontSize: "32px",
            fontWeight: 500,
            textAlign: "center",
            maxWidth: "820px",
            lineHeight: "1.4",
            margin: 0,
          }}
        >
          Track Shifts. Stay Visa Compliant. Build Savings.
        </p>
      </div>
    ),
    size
  )
}
