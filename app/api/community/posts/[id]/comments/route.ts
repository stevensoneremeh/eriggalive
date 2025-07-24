import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    } = await supabase.auth.getUser()

    // Fetch comments with user information
    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(`
        id,
        content,
        like_count,
        reply_count,
        created_at,
        user:users!community_comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    // Check if user has liked each comment
    let commentsWithLikes = comments || []

    if (user && comments && comments.length > 0) {
      // Get user profile to get the internal user ID
      const { data: userProfile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

      if (userProfile) {
        const commentIds = comments.map((comment) => comment.id)

        const { data: likes } = await supabase
          .from("community_comment_likes")
          .select("comment_id")
          .eq("user_id", userProfile.id)
          .in("comment_id", commentIds)

        const likedCommentIds = new Set(likes?.map((like) => like.comment_id) || [])

        commentsWithLikes = comments.map((comment) => ({
          ...comment,
          has_liked: likedCommentIds.has(comment.id),
        }))
      }
    } else {
      commentsWithLikes =
        comments?.map((comment) => ({
          ...comment,
          has_liked: false,
        })) || []
    }

    return NextResponse.json({
      success: true,
      comments: commentsWithLikes,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: profile.id,
        content: content.trim(),
      })
      .select(`
        id,
        content,
        like_count,
        reply_count,
        created_at,
        user:users!community_comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Update post comment count
    const { error: updateError } = await supabase
      .from("community_posts")
      .update({ comment_count: supabase.sql`comment_count + 1` })
      .eq("id", postId)

    if (updateError) {
      console.error("Error updating comment count:", updateError)
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        has_liked: false,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
