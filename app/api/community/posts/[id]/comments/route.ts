import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    // Return sample comments for now
    const sampleComments = [
      {
        id: 1,
        post_id: postId,
        user_id: "1",
        content: "This is fire! 🔥 Erigga never disappoints",
        like_count: 3,
        reply_count: 0,
        parent_comment_id: null,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "1",
          username: "erigga_fan1",
          full_name: "Erigga Fan",
          avatar_url: "/placeholder-user.jpg",
          tier: "erigga_citizen"
        },
        user_liked: false
      },
      {
        id: 2,
        post_id: postId,
        user_id: "2",
        content: "Paper Boi Chronicles remains my favorite album! When's the next one dropping?",
        like_count: 7,
        reply_count: 1,
        parent_comment_id: null,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "2",
          username: "warri_boy",
          full_name: "Warri Boy",
          avatar_url: "/placeholder-user.jpg",
          tier: "erigga_indigen"
        },
        user_liked: false
      }
    ]

    return NextResponse.json({
      success: true,
      comments: sampleComments
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 })
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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, parent_comment_id } = body
    const postId = params.id

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 })
    }

    // For now, return a mock comment
    const newComment = {
      id: Date.now(),
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      like_count: 0,
      reply_count: 0,
      parent_comment_id: parent_comment_id || null,
      created_at: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        full_name: user.user_metadata?.full_name || 'User',
        avatar_url: user.user_metadata?.avatar_url || '/placeholder-user.jpg',
        tier: 'erigga_citizen'
      },
      user_liked: false
    }

    return NextResponse.json({
      success: true,
      comment: newComment
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 })
  }
}
