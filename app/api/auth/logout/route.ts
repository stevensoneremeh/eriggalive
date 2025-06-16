import { type NextRequest, NextResponse } from "next/server"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { environment } from "@/lib/config/environment"

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies or headers
    const sessionToken =
      request.cookies.get("session_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!sessionToken) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // Get user ID from session if available
    const userInfo = request.cookies.get("user_info")?.value
    let userId: string | undefined

    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo)
        userId = parsed.id?.toString()
      } catch {
        // Ignore parsing errors
      }
    }

    // Logout from auth service
    const result = await enhancedAuthService.logout(sessionToken, userId)

    // Create response
    const response = NextResponse.json({
      success: result.success,
      message: result.success ? "Logged out successfully" : "Logout failed",
    })

    // Clear all auth cookies
    const isProduction = environment.isProduction()

    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    response.cookies.set("user_info", "", {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout API error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred during logout",
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
