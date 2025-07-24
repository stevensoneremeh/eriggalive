import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get posts with user and category information
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey (
          id,
          name,
          description
        )
      `)
      .order("created_at", { ascending: false })

    if (postsError) {
      console.error("Database error:", postsError)
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, content, category_id } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Create the post
    const { data: post, error: insertError } = await supabase
      .from("community_posts")
      .insert({
        title: title.trim(),
        content: content.trim(),
        user_id: profile.id,
        category_id: category_id || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to create post", details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
