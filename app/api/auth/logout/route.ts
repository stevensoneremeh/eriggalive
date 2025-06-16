import { type NextRequest, NextResponse } from "next/server"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionToken, userId, logoutAll = false } = body

    if (logoutAll && userId) {
      const result = await enhancedAuthService.logoutAllDevices(userId)
      return NextResponse.json(result)
    } else if (sessionToken) {
      const result = await enhancedAuthService.logout(sessionToken, userId)
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ success: false, error: "Session token or user ID required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
