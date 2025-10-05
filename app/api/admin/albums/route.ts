import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

<<<<<<< HEAD
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()
=======
// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = await createAdminSupabaseClient()
>>>>>>> new

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
    const { streaming_links, ...albumData } = body

    // Create slug from title
    const slug = albumData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Insert album
    const { data: album, error: albumError } = await adminSupabase
      .from("albums")
      .insert({
        ...albumData,
        slug,
        total_tracks: 0,
        duration_seconds: 0,
        play_count: 0,
        like_count: 0,
        download_count: 0,
        is_featured: false,
        is_published: true,
        explicit_content: false,
        tags: [],
        metadata: {},
      })
      .select()
      .single()

    if (albumError) {
      console.error("Album creation error:", albumError)
      return NextResponse.json({ error: "Failed to create album" }, { status: 500 })
    }

    // Insert streaming links if provided
    if (streaming_links && streaming_links.length > 0) {
      const validLinks = streaming_links.filter((link: any) => link.platform && link.url)
      if (validLinks.length > 0) {
        await adminSupabase.from("streaming_links").insert(
          validLinks.map((link: any) => ({
            album_id: album.id,
            platform: link.platform,
            url: link.url,
            is_verified: false,
          })),
        )
      }
    }

    return NextResponse.json({ success: true, album })
  } catch (error) {
    console.error("Album upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
