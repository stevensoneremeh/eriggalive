import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-utils"

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ success: false, message: "Session ID is required" }, { status: 400 })
    }

    // In a real implementation, you would create a Daily.co room here
    // For demo purposes, we'll create a mock room
    const roomName = `meet-greet-${session_id}-${Date.now()}`
    const roomUrl = `https://erigga.daily.co/${roomName}`

    const supabase = createServerSupabaseClient()

    // Update session with room details
    const { data, error } = await supabase
      .from("meet_greet_sessions")
      .update({
        room_url: roomUrl,
        room_name: roomName,
        status: "ready",
      })
      .eq("id", session_id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Failed to create room" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        room_url: roomUrl,
        room_name: roomName,
        session: data,
      },
    })
  } catch (error) {
    console.error("Room creation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
