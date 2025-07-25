import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    // Generate room name
    const roomName = `meet-greet-${sessionId}-${Date.now()}`

    // In a real implementation, you would create a Daily.co room here
    // For now, we'll return mock data
    const roomUrl = `https://your-daily-domain.daily.co/${roomName}`

    return NextResponse.json({
      success: true,
      room_name: roomName,
      room_url: roomUrl,
    })
  } catch (error) {
    console.error("Room creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to create room" }, { status: 500 })
  }
}
