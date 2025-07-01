import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Add performance and health monitoring headers
  response.headers.set("Server-Timing", `middleware;dur=${Date.now()}`)

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Handle health check endpoints
  if (pathname.startsWith("/api/health")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    return response
  }

  // For all other cases, proceed normally
  return response
}

// Configure matcher to handle all routes except static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|videos/|fonts/|placeholder).*)",
  ],
}
