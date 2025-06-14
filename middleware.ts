import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]

// Define paths that should always be accessible regardless of auth status
const ALWAYS_ACCESSIBLE = ["/api", "/_next", "/favicon.ico", "/images", "/videos", "/fonts"]

// Define paths that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/community",
  "/chronicles",
  "/vault",
  "/tickets",
  "/premium",
  "/merch",
  "/settings",
  "/admin",
]

export function middleware(request: NextRequest) {
  // Add health check headers for monitoring
  const response = NextResponse.next()

  // Add server timing header for performance monitoring
  response.headers.set("Server-Timing", `total;dur=${Date.now()}`)

  // Add health check endpoint info
  if (request.nextUrl.pathname.startsWith("/api/health")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  }

  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Check if the path is in the always accessible list or is a static file
  if (ALWAYS_ACCESSIBLE.some((path) => pathname.startsWith(path)) || pathname.includes(".")) {
    return NextResponse.next()
  }

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if the user is authenticated by looking for the auth cookies
  const hasAuthCookie = request.cookies.has("erigga_auth")
  const hasSessionCookie = request.cookies.has("erigga_auth_session")
  const isAuthenticated = hasAuthCookie || hasSessionCookie

  // If accessing a protected route without authentication
  if (requiresAuth && !isAuthenticated) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)

    // Create the response with the redirect
    const response = NextResponse.redirect(redirectUrl)

    // Add a temporary cookie to indicate where to redirect after login
    response.cookies.set("redirect_after_login", pathname, {
      path: "/",
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true,
      sameSite: "lax",
    })

    return response
  }

  // If already authenticated and trying to access login/signup pages
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    // Check if there's a redirect parameter
    const redirectParam = request.nextUrl.searchParams.get("redirect")

    // Redirect to the specified path or dashboard
    const redirectUrl = redirectParam || "/dashboard"
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // For all other cases, proceed normally
  return response
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
