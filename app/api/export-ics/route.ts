import { NextResponse } from "next/server"

function decodePayload(data: string) {
  try {
    return decodeURIComponent(escape(atob(data)))
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const encoded = searchParams.get("data") ?? ""
  const fileNameParam = searchParams.get("filename") ?? "shiftwise-export.ics"
  const safeFileName = fileNameParam.replace(/[^a-zA-Z0-9._-]/g, "_")
  const decoded = decodePayload(encoded)

  if (!decoded) {
    return NextResponse.json({ error: "Invalid export payload" }, { status: 400 })
  }

  return new NextResponse(decoded, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${safeFileName}\"`,
      "Cache-Control": "no-store",
    },
  })
}
