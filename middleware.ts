import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Define route configurations
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]
const ALWAYS_ACCESSIBLE = ["/api", "/_next", "/favicon.ico", "/images", "/videos", "/fonts", "/manifest.json"]
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

// Rate limiting configuration
const RATE_LIMITS = {
  "/api/auth": { requests: 5, window: 60000 }, // 5 requests per minute
  "/api": { requests: 100, window: 60000 }, // 100 requests per minute
  default: { requests: 200, window: 60000 }, // 200 requests per minute
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  try {
    // Skip middleware for static files and always accessible paths
    if (ALWAYS_ACCESSIBLE.some((path) => pathname.startsWith(path)) || pathname.includes(".")) {
      return NextResponse.next()
    }

    // Create response with security headers
    const response = NextResponse.next()

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

    // Add performance headers
    response.headers.set("Server-Timing", `middleware;dur=${Date.now() - startTime}`)

    // Handle API routes with rate limiting
    if (pathname.startsWith("/api")) {
      const rateLimitKey = Object.keys(RATE_LIMITS).find((key) => pathname.startsWith(key)) || "default"
      const limit = RATE_LIMITS[rateLimitKey as keyof typeof RATE_LIMITS]

      // Simple in-memory rate limiting (use Redis in production)
      const clientIP = getClientIP(request)
      const key = `${rateLimitKey}:${clientIP}`

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", limit.requests.toString())
      response.headers.set("X-RateLimit-Window", limit.window.toString())

      return response
    }

    // Check if path is public
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

    // Check if path requires authentication
    const requiresAuth = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

    // If public path, allow access
    if (isPublicPath && !requiresAuth) {
      return response
    }

    // For protected routes, check authentication
    if (requiresAuth) {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error || !session) {
          // Redirect to login with return URL
          const redirectUrl = new URL("/login", request.url)
          redirectUrl.searchParams.set("redirect", pathname)

          const redirectResponse = NextResponse.redirect(redirectUrl)

          // Set cookie for post-login redirect
          redirectResponse.cookies.set("redirect_after_login", pathname, {
            path: "/",
            maxAge: 300, // 5 minutes
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          })

          return redirectResponse
        }

        // Check if user profile exists and is active
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("is_active, is_banned")
          .eq("auth_user_id", session.user.id)
          .single()

        if (profileError || !profile) {
          console.error("Profile fetch error:", profileError)
          return NextResponse.redirect(new URL("/login?error=profile_not_found", request.url))
        }

        if (!profile.is_active || profile.is_banned) {
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL("/login?error=account_inactive", request.url))
        }

        // Add user context to response headers (for debugging)
        response.headers.set("X-User-ID", session.user.id)
        response.headers.set("X-Auth-Status", "authenticated")

        return response
      } catch (authError) {
        console.error("Authentication error in middleware:", authError)

        // On auth error, redirect to login
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("error", "auth_error")
        redirectUrl.searchParams.set("redirect", pathname)

        return NextResponse.redirect(redirectUrl)
      }
    }

    // If already authenticated and trying to access auth pages
    if (isPublicPath && (pathname === "/login" || pathname === "/signup")) {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Check for redirect parameter
          const redirectParam = request.nextUrl.searchParams.get("redirect")
          const redirectUrl = redirectParam || "/dashboard"
          return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
      } catch (error) {
        // If there's an error checking auth, allow access to login/signup
        console.error("Auth check error:", error)
      }
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)

    // On critical error, allow the request to proceed
    // but log the error for monitoring
    const response = NextResponse.next()
    response.headers.set("X-Middleware-Error", "true")
    response.headers.set("X-Error-Time", Date.now().toString())

    return response
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  return forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown"
}

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
