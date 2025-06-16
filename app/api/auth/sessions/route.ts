import { type NextRequest, NextResponse } from "next/server"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const sessions = await enhancedAuthService.getUserSessions(userId)

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error("Sessions API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
