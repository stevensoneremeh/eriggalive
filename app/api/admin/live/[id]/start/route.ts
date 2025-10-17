
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

    const streamId = params.id

    // Update stream status to live
    const { data: stream, error: updateError } = await supabase
      .from("live_streams")
      .update({
        is_live: true,
        started_at: new Date().toISOString(),
      })
      .eq("id", streamId)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to start stream" }, { status: 500 })
    }

    // Notify all users about live stream
    await supabase.from("notifications").insert({
      type: "live_stream",
      title: "🔴 Live Stream Started!",
      message: `${stream.title} is now live!`,
      data: {
        stream_id: streamId,
        playback_id: stream.mux_playback_id,
      },
      send_to_all: true,
    })

    return NextResponse.json({ stream })

  } catch (error) {
    console.error("Stream start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
