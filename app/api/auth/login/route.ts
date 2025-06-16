import { type NextRequest, NextResponse } from "next/server"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { environment } from "@/lib/config/environment"
import { z } from "zod"

// Request validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    // Check if maintenance mode is enabled
    if (environment.isFeatureEnabled("maintenanceMode")) {
      return NextResponse.json(
        {
          error: "Service temporarily unavailable",
          message: "The platform is currently under maintenance. Please try again later.",
        },
        { status: 503 },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = loginSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { email, password, rememberMe } = validationResult.data

    // Get client information
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || "Unknown"

    // Create device info (simplified for server-side)
    const deviceInfo = {
      userAgent,
      platform: "Server",
      browser: "Server",
      os: "Server",
      isMobile: /Mobile|Android|iPhone|iPad/i.test(userAgent),
    }

    // Attempt login
    const result = await enhancedAuthService.login({
      email,
      password,
      rememberMe,
      deviceInfo,
      ipAddress: clientIP,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Login failed",
          message: "Invalid credentials or account issue",
        },
        { status: 401 },
      )
    }

    // Create response with secure cookies
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: "Login successful",
    })

    // Set secure HTTP-only cookies
    if (result.session && result.tokens) {
      const isProduction = environment.isProduction()

      response.cookies.set("session_token", result.session.sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 24 hours
        path: "/",
      })

      response.cookies.set("refresh_token", result.tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })

      // Set user info cookie (not sensitive data)
      response.cookies.set(
        "user_info",
        JSON.stringify({
          id: result.user?.id,
          username: result.user?.username,
          tier: result.user?.tier,
        }),
        {
          httpOnly: false,
          secure: isProduction,
          sameSite: "lax",
          maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
          path: "/",
        },
      )
    }

    return response
  } catch (error) {
    console.error("Login API error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred during login",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": environment.getCorsOrigins().join(", "),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  return forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || request.ip || "unknown"
}
