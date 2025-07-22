import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const postId = Number.parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if bookmark already exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", userData.id)
      .eq("post_id", postId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking bookmark:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", userData.id)
        .eq("post_id", postId)

      if (deleteError) {
        console.error("Error removing bookmark:", deleteError)
        return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        bookmarked: false,
        message: "Bookmark removed!",
      })
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: userData.id,
        post_id: postId,
      })

      if (insertError) {
        console.error("Error adding bookmark:", insertError)
        return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        bookmarked: true,
        message: "Post bookmarked!",
      })
    }
  } catch (error) {
    console.error("Bookmark API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const postId = Number.parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ bookmarked: false })
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ bookmarked: false })
    }

    // Check if bookmark exists
    const { data: bookmark, error: checkError } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", userData.id)
      .eq("post_id", postId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking bookmark:", checkError)
      return NextResponse.json({ bookmarked: false })
    }

    return NextResponse.json({ bookmarked: !!bookmark })
  } catch (error) {
    console.error("Bookmark check API error:", error)
    return NextResponse.json({ bookmarked: false })
  }
}
