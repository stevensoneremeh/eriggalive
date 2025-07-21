import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const postId = Number.parseInt(id)

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("user_bookmarks")
      .select("*")
      .eq("user_id", userProfile.id)
      .eq("post_id", postId)
      .single()

    let bookmarked = false

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", userProfile.id)
        .eq("post_id", postId)

      if (deleteError) {
        console.error("Error removing bookmark:", deleteError)
        return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
      }

      bookmarked = false
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: userProfile.id,
        post_id: postId,
      })

      if (insertError) {
        console.error("Error adding bookmark:", insertError)
        return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
      }

      bookmarked = true
    }

    return NextResponse.json({
      success: true,
      bookmarked,
      message: bookmarked ? "Post bookmarked!" : "Bookmark removed!",
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
