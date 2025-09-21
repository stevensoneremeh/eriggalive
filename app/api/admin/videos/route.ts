import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = await createAdminSupabaseClient()

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
    const { duration, ...videoData } = body

    // Parse duration (e.g., "4:15" to seconds)
    const durationSeconds = duration.split(":").reduce((acc: number, time: string) => 60 * acc + +time, 0)

    // Create slug from title
    const slug = videoData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Insert video
    const { data: video, error: videoError } = await adminSupabase
      .from("music_videos")
      .insert({
        ...videoData,
        slug,
        duration_seconds: durationSeconds,
        views: 0,
        likes: 0,
        dislikes: 0,
        comments_count: 0,
        is_featured: false,
        is_published: true,
        explicit_content: false,
        quality: "HD",
        tags: [],
        metadata: {},
      })
      .select()
      .single()

    if (videoError) {
      console.error("Video creation error:", videoError)
      return NextResponse.json({ error: "Failed to create video" }, { status: 500 })
    }

    return NextResponse.json({ success: true, video })
  } catch (error) {
    console.error("Video upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
