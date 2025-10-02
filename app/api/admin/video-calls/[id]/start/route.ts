
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication and admin privileges
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from("users")
      .select("role, tier")
      .eq("auth_user_id", user.id)
      .single()

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin" && user.email !== "info@eriggalive.com")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const callId = params.id

    // Get the call details
    const { data: call, error: callError } = await supabase
      .from("meet_greet_bookings")
      .select("*, user:users!inner(display_name, email)")
      .eq("id", callId)
      .single()

    if (callError || !call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    // Create Daily.co room
    const dailyResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `erigga-meetgreet-${callId}`,
        privacy: "private",
        properties: {
          max_participants: 2,
          enable_screenshare: true,
          enable_chat: true,
          exp: Math.floor(Date.now() / 1000) + (call.duration * 60) + 300, // Duration + 5 minutes buffer
        },
      }),
    })

    if (!dailyResponse.ok) {
      console.error("Daily.co error:", await dailyResponse.text())
      return NextResponse.json({ error: "Failed to create video room" }, { status: 500 })
    }

    const roomData = await dailyResponse.json()

    // Update call with Daily.co room info
    const { data: updatedCall, error: updateError } = await supabase
      .from("meet_greet_bookings")
      .update({
        status: "in_progress",
        daily_room_url: roomData.url,
        daily_room_name: roomData.name,
        started_at: new Date().toISOString(),
      })
      .eq("id", callId)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to start call" }, { status: 500 })
    }

    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: call.user_id,
      type: "video_call_ready",
      title: "🎥 Your Video Call is Ready!",
      message: `Erigga is ready for your meet & greet session. Click to join!`,
      data: {
        call_id: callId,
        room_url: roomData.url,
      },
    })

    return NextResponse.json({ 
      call: updatedCall,
      room_url: roomData.url,
      room_name: roomData.name 
    })

  } catch (error) {
    console.error("Video call start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
