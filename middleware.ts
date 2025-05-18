import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the API key from the client-side request
  const clientApiKey = request.headers.get("X-API-Key")

  // If we're calling the transcribe API and there's no API key in the environment
  // but the client provided one, we'll use that
  if (request.nextUrl.pathname === "/api/transcribe" && !process.env.SILICONFLOW_API_KEY && clientApiKey) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("Authorization", `Bearer ${clientApiKey}`)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
