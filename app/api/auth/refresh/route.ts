import { type NextRequest, NextResponse } from "next/server"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: "Refresh token required" }, { status: 400 })
    }

    const result = await enhancedAuthService.refreshToken(refreshToken)

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        tokens: result.tokens,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("Refresh API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
