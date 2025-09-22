import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user for vote status
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch posts with user and category data
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        media_url,
        media_type,
        hashtags,
        vote_count,
        comment_count,
        view_count,
        created_at,
        updated_at,
        user_id,
        category_id,
        users!inner (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        community_categories!inner (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('is_published', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 })
    }

    // Check user votes if authenticated
    let userVotes = []
    if (user && posts?.length > 0) {
      const { data: votes } = await supabase
        .from('community_post_votes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', posts.map(p => p.id))

      userVotes = votes?.map(v => v.post_id) || []
    }

    // Format posts data
    const formattedPosts = posts?.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      media_url: post.media_url,
      media_type: post.media_type,
      hashtags: post.hashtags || [],
      vote_count: post.vote_count || 0,
      comment_count: post.comment_count || 0,
      view_count: post.view_count || 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_id: post.user_id,
      user: {
        id: post.users.id,
        username: post.users.username,
        full_name: post.users.full_name,
        avatar_url: post.users.avatar_url,
        tier: post.users.tier
      },
      category: {
        id: post.community_categories.id,
        name: post.community_categories.name,
        color: post.community_categories.color,
        icon: post.community_categories.icon
      },
      user_voted: userVotes.includes(post.id)
    })) || []

    return NextResponse.json({
      success: true,
      posts: formattedPosts
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { title, content, category_id, hashtags, media_url, media_type } = body

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 })
    }

    // Insert the post into database
    const { data: post, error: insertError } = await supabase
      .from('community_posts')
      .insert({
        title: title || null,
        content: content.trim(),
        user_id: user.id,
        category_id: category_id || 1,
        hashtags: hashtags || [],
        media_url: media_url || null,
        media_type: media_type || null,
        vote_count: 0,
        comment_count: 0,
        view_count: 0,
        is_published: true,
        is_deleted: false
      })
      .select(`
        id,
        title,
        content,
        media_url,
        media_type,
        hashtags,
        vote_count,
        comment_count,
        view_count,
        created_at,
        updated_at,
        user_id,
        category_id
      `)
      .single()

    if (insertError) {
      console.error('Error inserting post:', insertError)
      return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
    }

    // Get user and category data
    const { data: userData } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, tier')
      .eq('id', user.id)
      .single()

    const { data: categoryData } = await supabase
      .from('community_categories')
      .select('id, name, color, icon')
      .eq('id', category_id || 1)
      .single()

    const newPost = {
      ...post,
      user: {
        id: userData?.id || user.id,
        username: userData?.username || user.email?.split('@')[0] || 'user',
        full_name: userData?.full_name || user.user_metadata?.full_name || 'User',
        avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url || '/placeholder-user.jpg',
        tier: userData?.tier || 'erigga_citizen'
      },
      category: {
        id: categoryData?.id || 1,
        name: categoryData?.name || 'General Discussion',
        color: categoryData?.color || '#3B82F6',
        icon: categoryData?.icon || '💬'
      },
      user_voted: false
    }

    return NextResponse.json({
      success: true,
      post: newPost
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
  }
}