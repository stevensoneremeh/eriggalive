import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Refresh session if expired - required for Server Components
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // If there's an error getting the session, continue without blocking
    if (error) {
      console.error("Middleware auth error:", error)
      return res
    }

    const { pathname } = req.nextUrl

    // Define protected routes
    const protectedRoutes = [
      "/dashboard",
      "/profile",
      "/coins",
      "/chat",
      "/community",
      "/mission",
      "/premium",
      "/admin",
    ]

    // Define auth routes
    const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"]

    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    // Check if current path is an auth route
    const isAuthRoute = authRoutes.includes(pathname)

    // If accessing protected route without session, redirect to login
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("returnUrl", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If accessing auth route with session, redirect to dashboard
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // Continue without blocking on errors
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
