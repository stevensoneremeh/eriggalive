import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Route configurations
const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/terms", "/privacy"]
const ALWAYS_ACCESSIBLE = [
  "/api/health",
  "/api/auth/callback",
  "/_next",
  "/favicon.ico",
  "/images",
  "/videos",
  "/fonts",
  "/manifest.json",
  "/.well-known",
]
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
  "/coins",
]

const ADMIN_PATHS = ["/admin"]
const RATE_LIMITS = {
  "/api/auth": { requests: 5, window: 60000 },
  "/api/coins": { requests: 10, window: 60000 },
  "/api": { requests: 100, window: 60000 },
  default: { requests: 200, window: 60000 },
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  try {
    // Skip middleware for static files and always accessible paths
    if (
      ALWAYS_ACCESSIBLE.some((path) => pathname.startsWith(path)) ||
      pathname.includes(".") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/health")
    ) {
      return NextResponse.next()
    }

    // Create response with security headers
    const response = NextResponse.next()

    // Production security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    // CORS headers for API routes
    if (pathname.startsWith("/api/")) {
      response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "*")
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    }

    // Performance headers
    response.headers.set("Server-Timing", `middleware;dur=${Date.now() - startTime}`)

    // Handle API routes with enhanced rate limiting
    if (pathname.startsWith("/api/")) {
      const rateLimitResult = await handleRateLimit(request, pathname)
      if (rateLimitResult) return rateLimitResult

      // Add rate limit headers to response
      const rateLimitKey = Object.keys(RATE_LIMITS).find((key) => pathname.startsWith(key)) || "default"
      const limit = RATE_LIMITS[rateLimitKey as keyof typeof RATE_LIMITS]
      response.headers.set("X-RateLimit-Limit", limit.requests.toString())
      response.headers.set("X-RateLimit-Window", (limit.window / 1000).toString())

      return response
    }

    // Check if path is public
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    const requiresAuth = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    const requiresAdmin = ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

    // Allow access to public paths
    if (isPublicPath && !requiresAuth) {
      return response
    }

    // Handle authentication for protected routes
    if (requiresAuth) {
      const authResult = await handleAuthentication(request)

      if (!authResult.success) {
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("redirect", pathname)
        if (authResult.error) {
          redirectUrl.searchParams.set("error", authResult.error)
        }

        const redirectResponse = NextResponse.redirect(redirectUrl)
        redirectResponse.cookies.set("redirect_after_login", pathname, {
          path: "/",
          maxAge: 300,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        })

        return redirectResponse
      }

      // Check admin access
      if (requiresAdmin && authResult.user?.tier !== "admin") {
        return NextResponse.redirect(new URL("/dashboard?error=access_denied", request.url))
      }

      // Add user context to response headers
      response.headers.set("X-User-ID", authResult.user?.id || "")
      response.headers.set("X-User-Tier", authResult.user?.tier || "")
      response.headers.set("X-Auth-Status", "authenticated")

      return response
    }

    // Redirect authenticated users away from auth pages
    if (isPublicPath && (pathname === "/login" || pathname === "/signup")) {
      const authResult = await handleAuthentication(request)

      if (authResult.success) {
        const redirectParam = request.nextUrl.searchParams.get("redirect")
        const redirectUrl = redirectParam || "/dashboard"
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)

    // Return error response for API routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // For other routes, allow request to proceed but log error
    const response = NextResponse.next()
    response.headers.set("X-Middleware-Error", "true")
    response.headers.set("X-Error-Time", Date.now().toString())

    return response
  }
}

async function handleAuthentication(request: NextRequest): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Get session from Authorization header or cookies
    const authHeader = request.headers.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "") || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return { success: false, error: "no_session" }
    }

    // Validate session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select(`
        *,
        users (*)
      `)
      .eq("session_token", sessionToken)
      .eq("is_active", true)
      .single()

    if (sessionError || !sessionData) {
      return { success: false, error: "invalid_session" }
    }

    // Check session expiration
    if (new Date(sessionData.expires_at) < new Date()) {
      // Deactivate expired session
      await supabase
        .from("user_sessions")
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq("session_token", sessionToken)

      return { success: false, error: "session_expired" }
    }

    const user = sessionData.users as any

    // Check user status
    if (!user.is_active || user.is_banned) {
      return { success: false, error: "account_inactive" }
    }

    // Update session activity
    await supabase
      .from("user_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("session_token", sessionToken)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tier: user.tier,
        isActive: user.is_active,
      },
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, error: "auth_error" }
  }
}

async function handleRateLimit(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  try {
    const clientIP = getClientIP(request)
    const rateLimitKey = Object.keys(RATE_LIMITS).find((key) => pathname.startsWith(key)) || "default"
    const limit = RATE_LIMITS[rateLimitKey as keyof typeof RATE_LIMITS]

    // In production, this would use Redis
    // For now, we'll implement a simple in-memory rate limiter
    const key = `${rateLimitKey}:${clientIP}`
    const now = Date.now()

    // This is a simplified implementation
    // In production, use Redis with sliding window or token bucket algorithm
    const requests = await getRateLimitCount(key, now, limit.window)

    if (requests >= limit.requests) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(limit.window / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.requests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(now + limit.window).toISOString(),
            "Retry-After": Math.ceil(limit.window / 1000).toString(),
          },
        },
      )
    }

    // Record this request
    await recordRateLimitRequest(key, now)

    return null // Continue processing
  } catch (error) {
    console.error("Rate limit error:", error)
    return null // Allow request on error
  }
}

// Simplified rate limiting functions (use Redis in production)
const rateLimitStore = new Map<string, number[]>()

async function getRateLimitCount(key: string, now: number, window: number): Promise<number> {
  const requests = rateLimitStore.get(key) || []
  const validRequests = requests.filter((timestamp) => now - timestamp < window)
  rateLimitStore.set(key, validRequests)
  return validRequests.length
}

async function recordRateLimitRequest(key: string, timestamp: number): Promise<void> {
  const requests = rateLimitStore.get(key) || []
  requests.push(timestamp)
  rateLimitStore.set(key, requests)
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  return forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || request.ip || "unknown"
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/(.*)",
    "/((?!api/health).*)",
  ],
}
