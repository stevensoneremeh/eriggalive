import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/coins",
  "/premium",
  "/chat",
  "/community",
  "/mission",
  "/vault",
  "/tickets",
  "/merch",
  "/meet-greet",
]

// Define auth routes
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // Check if route requires authentication
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.includes(pathname)

    // If protected route and no session, redirect to login
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("returnUrl", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If auth route and has session, redirect to dashboard
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // Don't block the request on middleware errors
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\..*|api).*)",
  ],
}
