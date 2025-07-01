import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/terms", "/privacy"]

// Define paths that should always be accessible regardless of auth status
const ALWAYS_ACCESSIBLE = ["/api", "/_next", "/favicon.ico", "/images", "/videos", "/fonts", "/placeholder"]

// Define paths that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/community",
  "/chronicles",
  "/vault",
  "/tickets",
  "/premium",
  "/merch",
  "/coins",
  "/settings",
  "/admin",
]

// Define auth paths that authenticated users should be redirected away from
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

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

  // Skip middleware for always accessible paths and static files
  if (
    ALWAYS_ACCESSIBLE.some((path) => pathname.startsWith(path)) ||
    pathname.includes(".") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/")
  ) {
    return response
  }

  // Check authentication status
  const hasAuthCookie = request.cookies.has("erigga_auth")
  const hasSessionCookie = request.cookies.has("erigga_auth_session")
  const isAuthenticated = hasAuthCookie || hasSessionCookie

  // Get stored redirect path from cookies
  const storedRedirectPath = request.cookies.get("erigga_redirect_path")?.value

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if the path is an auth path
  const isAuthPath = AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Handle authenticated users accessing auth pages
  if (isAuthenticated && isAuthPath) {
    let redirectPath = "/dashboard"

    // Check for redirect parameter in URL
    const redirectParam = request.nextUrl.searchParams.get("redirect")
    if (
      redirectParam &&
      redirectParam.startsWith("/") &&
      PROTECTED_PATHS.some((path) => redirectParam === path || redirectParam.startsWith(`${path}/`))
    ) {
      redirectPath = redirectParam
    }
    // Check for stored redirect path
    else if (
      storedRedirectPath &&
      storedRedirectPath.startsWith("/") &&
      PROTECTED_PATHS.some((path) => storedRedirectPath === path || storedRedirectPath.startsWith(`${path}/`))
    ) {
      redirectPath = storedRedirectPath
    }

    const redirectResponse = NextResponse.redirect(new URL(redirectPath, request.url))

    // Clear the stored redirect path cookie
    redirectResponse.cookies.delete("erigga_redirect_path")

    return redirectResponse
  }

  // Handle unauthenticated users accessing protected routes
  if (requiresAuth && !isAuthenticated) {
    // Store the current path for post-login redirect
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)

    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Store redirect path in cookie for backup
    redirectResponse.cookies.set("erigga_redirect_path", pathname, {
      path: "/",
      maxAge: 60 * 10, // 10 minutes
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return redirectResponse
  }

  // Handle root path redirect for authenticated users
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
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
