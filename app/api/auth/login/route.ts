import { type NextRequest, NextResponse } from "next/server"
import { enhancedAuthService } from "@/lib/auth/enhanced-auth-service"
import { DeviceDetection } from "@/lib/auth/device-detection"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe = false } = body

    // Get client info
    const deviceInfo = DeviceDetection.getDeviceInfo()
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Attempt login
    const result = await enhancedAuthService.login({
      email,
      password,
      rememberMe,
      deviceInfo,
      ipAddress,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        tokens: result.tokens,
        session: {
          sessionToken: result.session?.sessionToken,
          expiresAt: result.session?.expiresAt,
          rememberMe: result.session?.rememberMe,
        },
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
