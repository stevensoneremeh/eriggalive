import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { publishEvent, ABLY_CHANNELS } from "@/lib/ably"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const postId = Number.parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(`
        *,
        author:profiles!community_comments_author_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        _count:community_comment_likes(count),
        user_liked:community_comment_likes!left(id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    // Transform the data to include like counts and user interactions
    const transformedComments =
      comments?.map((comment) => ({
        ...comment,
        like_count: comment._count?.[0]?.count || 0,
        user_liked: !!comment.user_liked?.[0]?.id,
      })) || []

    return NextResponse.json({ comments: transformedComments })
  } catch (error) {
    console.error("Error in comments GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = Number.parseInt(params.id)
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const body = await request.json()
    const { content, parent_id } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Insert the comment
    const { data: comment, error: insertError } = await supabase
      .from("community_comments")
      .insert({
        content,
        post_id: postId,
        author_id: user.id,
        parent_id: parent_id || null,
      })
      .select(`
        *,
        author:profiles!community_comments_author_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .single()

    if (insertError) {
      console.error("Error creating comment:", insertError)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Publish real-time event for new comment
    try {
      publishEvent(ABLY_CHANNELS.POST_COMMENTS(postId), "comment:created", {
        postId,
        comment: {
          ...comment,
          like_count: 0,
          user_liked: false,
        },
      })
    } catch (ablyError) {
      console.error("Failed to publish comment event:", ablyError)
      // Don't fail the request if real-time publishing fails
    }

    return NextResponse.json({
      comment: {
        ...comment,
        like_count: 0,
        user_liked: false,
      },
    })
  } catch (error) {
    console.error("Error in comments POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
