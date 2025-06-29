import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check admin privileges
    const { data: profile } = await supabase.from("users").select("tier, role").eq("auth_user_id", user.id).single()

    if (!profile || (profile.tier === "grassroot" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    const body = await request.json()
    const { streaming_links, duration, ...trackData } = body

    // Parse duration (e.g., "3:45" to seconds)
    const durationSeconds = duration.split(":").reduce((acc: number, time: string) => 60 * acc + +time, 0)

    // Create slug from title
    const slug = trackData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Insert track
    const { data: track, error: trackError } = await adminSupabase
      .from("tracks")
      .insert({
        ...trackData,
        slug,
        duration_seconds: durationSeconds,
        disc_number: 1,
        play_count: 0,
        like_count: 0,
        download_count: 0,
        share_count: 0,
        is_single: !trackData.album_id,
        is_featured: false,
        is_published: true,
        explicit_content: false,
        tags: [],
        metadata: {},
      })
      .select()
      .single()

    if (trackError) {
      console.error("Track creation error:", trackError)
      return NextResponse.json({ error: "Failed to create track" }, { status: 500 })
    }

    // Insert streaming links if provided
    if (streaming_links && streaming_links.length > 0) {
      const validLinks = streaming_links.filter((link: any) => link.platform && link.url)
      if (validLinks.length > 0) {
        await adminSupabase.from("streaming_links").insert(
          validLinks.map((link: any) => ({
            track_id: track.id,
            platform: link.platform,
            url: link.url,
            is_verified: false,
          })),
        )
      }
    }

    // Update album track count if track belongs to an album
    if (trackData.album_id) {
      const { data: albumTracks } = await adminSupabase
        .from("tracks")
        .select("duration_seconds")
        .eq("album_id", trackData.album_id)

      if (albumTracks) {
        const totalTracks = albumTracks.length
        const totalDuration = albumTracks.reduce((sum, t) => sum + (t.duration_seconds || 0), 0)

        await adminSupabase
          .from("albums")
          .update({
            total_tracks: totalTracks,
            duration_seconds: totalDuration,
          })
          .eq("id", trackData.album_id)
      }
    }

    return NextResponse.json({ success: true, track })
  } catch (error) {
    console.error("Track upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
