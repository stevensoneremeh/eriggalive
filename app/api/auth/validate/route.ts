import { type NextRequest, NextResponse } from "next/server"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionToken } = body

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Session token required" }, { status: 400 })
    }

    const result = await enhancedAuthService.validateSession(sessionToken)

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        session: result.session,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("Validate API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
