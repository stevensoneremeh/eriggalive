import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    const commentId = Number.parseInt(id)

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from("community_comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userProfile.id)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking like:", checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }

    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from("community_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userProfile.id)

      if (deleteError) {
        console.error("Error removing like:", deleteError)
        return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, liked: false })
    } else {
      // Add like
      const { error: insertError } = await supabase.from("community_comment_likes").insert({
        comment_id: commentId,
        user_id: userProfile.id,
      })

      if (insertError) {
        console.error("Error adding like:", insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, liked: true })
    }
  } catch (error: any) {
    console.error("Error in like comment API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
