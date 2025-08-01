import { NextResponse, type NextRequest } from "next/server"

// Define public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/terms", "/privacy", "/about"]

// Define paths that should always be accessible regardless of auth status
const ALWAYS_ACCESSIBLE = ["/api", "/_next", "/favicon.ico", "/images", "/videos", "/fonts", "/placeholder", "/erigga"]

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
  "/missions",
  "/meet-and-greet",
]

// Define auth paths that authenticated users should be redirected away from
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"]

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

  // Skip middleware for always accessible paths and static files
  if (
    ALWAYS_ACCESSIBLE.some((path) => pathname.startsWith(path)) ||
    pathname.includes(".") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/")
  ) {
    return response
  }

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if the path is an auth path
  const isAuthPath = AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Get auth token from cookies (simplified approach)
  const authToken =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("supabase-auth-token")?.value ||
    request.cookies.get("sb-localhost-auth-token")?.value

  const isAuthenticated = !!authToken

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

    return NextResponse.redirect(new URL(redirectPath, request.url))
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
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|videos/|fonts/|placeholder|erigga/).*)",
  ],
}
