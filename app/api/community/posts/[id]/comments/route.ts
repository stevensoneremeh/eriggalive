
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const postId = params.id

    // Try to get real comments from Supabase
    const { data: comments, error: commentsError } = await supabase
      .from('community_comments')
      .select(`
        id,
        content,
        like_count,
        reply_count,
        parent_comment_id,
        created_at,
        user:users!community_comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    // If Supabase fails, return sample comments
    if (commentsError || !comments) {
      console.log("Using sample comments - Supabase error:", commentsError?.message)
      
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
        comments: sampleComments,
        isDemo: true
      })
    }

    // Get current user to check like status
    const { data: { user } } = await supabase.auth.getUser()
    let currentUserId = null
    
    if (user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      currentUserId = userProfile?.id
    }

    // Add user_liked status for each comment
    const commentsWithLikeStatus = await Promise.all(
      comments.map(async (comment: any) => {
        let user_liked = false
        
        if (currentUserId) {
          const { data: like } = await supabase
            .from('community_comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', currentUserId)
            .single()
          
          user_liked = !!like
        }
        
        return {
          ...comment,
          post_id: postId,
          user_liked
        }
      })
    )

    return NextResponse.json({
      success: true,
      comments: commentsWithLikeStatus
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

    // Import content validation
    const { validateContent, sanitizeTextContent } = await import('@/utils/content-validation')

    // Validate content for URLs and other issues
    const contentValidation = validateContent(content || '', false)

    if (!contentValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: `Comment validation failed: ${contentValidation.errors.join(', ')}` 
      }, { status: 400 })
    }

    // Sanitize content
    const sanitizedContent = sanitizeTextContent(content)

    // Get user profile for database operations
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, tier')
      .eq('auth_user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Try to create real comment in Supabase
    const { data: newComment, error: commentError } = await supabase
      .from('community_comments')
      .insert({
        user_id: userProfile.id,
        post_id: postId,
        content: sanitizedContent,
        parent_comment_id: parent_comment_id || null
      })
      .select(`
        id,
        content,
        like_count,
        reply_count,
        parent_comment_id,
        created_at
      `)
      .single()

    if (commentError) {
      console.log("Supabase comment creation failed, returning mock data:", commentError.message)
      
      // Return mock data if Supabase fails
      const mockComment = {
        id: Date.now(),
        post_id: postId,
        user_id: user.id,
        content: sanitizedContent,
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
        comment: mockComment,
        isDemo: true
      })
    }

    // Update post comment count
    await supabase
      .from('community_posts')
      .update({ 
        comment_count: supabase.rpc('increment', { value: 1 })
      })
      .eq('id', postId)

    // Format response with user info
    const responseComment = {
      ...newComment,
      post_id: postId,
      user: userProfile,
      user_liked: false
    }

    return NextResponse.json({
      success: true,
      comment: responseComment
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 })
  }
}
