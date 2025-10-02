
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
      .select("*")
      .eq("id", callId)
      .single()

    if (callError || !call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    // Delete Daily.co room if it exists
    if (call.daily_room_name) {
      try {
        await fetch(`https://api.daily.co/v1/rooms/${call.daily_room_name}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          },
        })
      } catch (error) {
        console.error("Failed to delete Daily.co room:", error)
      }
    }

    // Update call status
    const { data: updatedCall, error: updateError } = await supabase
      .from("meet_greet_bookings")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", callId)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to end call" }, { status: 500 })
    }

    // Send thank you notification to user
    await supabase.from("notifications").insert({
      user_id: call.user_id,
      type: "video_call_completed",
      title: "🙏 Thank you for the session!",
      message: `Thanks for joining the meet & greet session. Hope you enjoyed it!`,
      data: {
        call_id: callId,
      },
    })

    return NextResponse.json({ call: updatedCall })

  } catch (error) {
    console.error("Video call end error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
