
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Stream title is required" }, { status: 400 })
    }

    // Create Mux live stream
    const muxResponse = await fetch("https://api.mux.com/video/v1/live-streams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        playback_policy: ["public"],
        new_asset_settings: {
          playback_policy: ["public"],
        },
      }),
    })

    let muxData = null
    if (muxResponse.ok) {
      muxData = await muxResponse.json()
    }

    // Create stream record in database
    const { data: stream, error: streamError } = await supabase
      .from("live_streams")
      .insert({
        title: title.trim(),
        description: description?.trim() || "",
        mux_stream_id: muxData?.data?.id,
        mux_playback_id: muxData?.data?.playback_ids?.[0]?.id,
        mux_stream_key: muxData?.data?.stream_key,
        is_live: false,
        viewer_count: 0,
        created_by: profile.id,
      })
      .select()
      .single()

    if (streamError) {
      console.error("Database error:", streamError)
      return NextResponse.json({ error: "Failed to create stream record" }, { status: 500 })
    }

    return NextResponse.json({ 
      stream,
      mux_data: muxData?.data 
    })

  } catch (error) {
    console.error("Stream creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
