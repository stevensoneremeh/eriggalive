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

    // Create slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Insert gallery item
    const { data: galleryItem, error: galleryError } = await adminSupabase
      .from("gallery_items")
      .insert({
        ...body,
        slug,
        views: 0,
        likes: 0,
        downloads: 0,
        is_featured: false,
        is_published: true,
        camera_info: {},
        tags: [],
        metadata: {},
      })
      .select()
      .single()

    if (galleryError) {
      console.error("Gallery creation error:", galleryError)
      return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 })
    }

    return NextResponse.json({ success: true, galleryItem })
  } catch (error) {
    console.error("Gallery upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
