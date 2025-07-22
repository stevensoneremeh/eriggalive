import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const postId = params.id

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if post is bookmarked
    const { data: bookmark } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", profile.id)
      .eq("post_id", postId)
      .single()

    return NextResponse.json({
      success: true,
      bookmarked: !!bookmark,
    })
  } catch (error) {
    console.error("Error checking bookmark:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const postId = params.id

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", profile.id)
      .eq("post_id", postId)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase.from("user_bookmarks").delete().eq("id", existingBookmark.id)

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({
        success: true,
        bookmarked: false,
        message: "Bookmark removed",
      })
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: profile.id,
        post_id: Number.parseInt(postId),
        bookmark_type: "post",
      })

      if (insertError) {
        throw insertError
      }

      return NextResponse.json({
        success: true,
        bookmarked: true,
        message: "Post bookmarked",
      })
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
