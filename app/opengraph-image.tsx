import { ImageResponse } from "next/og"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #071321 0%, #0e2238 55%, #12304a 100%)",
          color: "#f8fafc",
          padding: "56px 64px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #15c5a2 0%, #0ea5e9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
              color: "#022c22",
            }}
          >
            ⚡
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "0.2px" }}>ShiftWise</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          <div style={{ fontSize: 68, lineHeight: 1.04, fontWeight: 800 }}>Smart Shift Management for Students</div>
          <div style={{ fontSize: 30, lineHeight: 1.3, color: "#bfdbfe" }}>
            Track shifts, manage earnings, budget smarter, and hit your savings goals.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#99f6e4", fontSize: 26, fontWeight: 600 }}>shiftwise.app</div>
          <div
            style={{
              border: "1px solid rgba(148, 163, 184, 0.45)",
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 20,
              color: "#dbeafe",
            }}
          >
            Built for shift workers
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
