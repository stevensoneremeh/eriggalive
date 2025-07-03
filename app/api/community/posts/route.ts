import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { content, categoryId } = body

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Post content is required" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    // Create post
    const { data: newPost, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userProfile.id,
        category_id: Number.parseInt(categoryId),
        content: content.trim(),
        is_published: true,
        is_deleted: false,
        vote_count: 0,
        comment_count: 0,
      })
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (postError) {
      console.error("Error creating post:", postError)
      return NextResponse.json({ success: false, error: postError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: newPost })
  } catch (error: any) {
    console.error("Error in create post API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
