import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Try to get real posts from Supabase
    const query = supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        media_url,
        media_type,
        vote_count,
        comment_count,
        hashtags,
        created_at,
        updated_at,
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
          color,
          icon
        )
      `)
      .eq('is_published', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(20)

    // Add category filter if specified
    if (category && category !== 'all') {
      query.eq('category_id', category)
    }

    const { data: posts, error: postsError } = await query

    // If Supabase is not configured or there's an error, return sample posts
    if (postsError || !posts) {
      console.log("Using sample posts - Supabase error:", postsError?.message)

      const samplePosts = [
        {
          id: 1,
          title: "Just listened to Paper Boi Chronicles again! 🔥",
          content: "This track never gets old. Erigga's storytelling is unmatched. Anyone else got this on repeat?",
          user_id: "1",
          category_id: 1,
          vote_count: 12,
          comment_count: 5,
          hashtags: ["paperboi", "erigga", "music"],
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: {
            id: "1",
            username: "paperboi_fan",
            full_name: "Erigga Fan",
            avatar_url: "/placeholder-user.jpg",
            tier: "erigga_citizen"
          },
          category: {
            id: 1,
            name: "Music Discussion",
            color: "#8B5CF6",
            icon: "🎵"
          },
          user_voted: false
        },
        {
          id: 2,
          title: "New fan art I created! 🎨",
          content: "Spent the weekend working on this Erigga portrait. What y'all think?",
          media_url: "/erigga/photoshoots/erigga-professional-shoot.jpeg",
          user_id: "2",
          category_id: 2,
          vote_count: 25,
          comment_count: 8,
          hashtags: ["fanart", "erigga", "art"],
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          user: {
            id: "2",
            username: "artist_warri",
            full_name: "Warri Artist",
            avatar_url: "/placeholder-user.jpg",
            tier: "erigga_indigen"
          },
          category: {
            id: 2,
            name: "Fan Art",
            color: "#10B981",
            icon: "🎨"
          },
          user_voted: true
        },
        {
          id: 3,
          title: "Anyone going to the next concert?",
          content: "Heard Erigga might be announcing tour dates soon. Who else is ready to catch him live?",
          user_id: "3",
          category_id: 3,
          vote_count: 8,
          comment_count: 12,
          hashtags: ["concert", "tour", "live"],
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          user: {
            id: "3",
            username: "concert_lover",
            full_name: "Live Music Fan",
            avatar_url: "/placeholder-user.jpg",
            tier: "erigga_citizen"
          },
          category: {
            id: 3,
            name: "Events",
            color: "#F59E0B",
            icon: "🎤"
          },
          user_voted: false
        }
      ]

      return NextResponse.json({
        success: true,
        posts: samplePosts,
        isDemo: true
      })
    }

    // Get current user to check vote status
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

    // Add user_voted status for each post
    const postsWithVoteStatus = await Promise.all(
      posts.map(async (post: any) => {
        let user_voted = false

        if (currentUserId) {
          const { data: vote } = await supabase
            .from('community_post_votes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', currentUserId)
            .single()

          user_voted = !!vote
        }

        return {
          ...post,
          user_voted
        }
      })
    )

    return NextResponse.json({
      success: true,
      posts: postsWithVoteStatus
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
    const { title, content, category_id, hashtags } = body

    // Import content validation (only import what we need)
    const { validateContent, sanitizeTextContent } = await import('@/utils/content-validation')

    // Validate content for URLs and other issues
    const titleValidation = validateContent(title || '', false)
    const contentValidation = validateContent(content || '', false)

    if (!titleValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: `Title validation failed: ${titleValidation.errors.join(', ')}` 
      }, { status: 400 })
    }

    if (!contentValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: `Content validation failed: ${contentValidation.errors.join(', ')}` 
      }, { status: 400 })
    }

    // Sanitize content
    const sanitizedTitle = sanitizeTextContent(title)
    const sanitizedContent = sanitizeTextContent(content)

    // Get or create user profile for database operations
    let { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, tier')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.log("User profile not found, creating new profile")

      // Create user profile if it doesn't exist
      const { data: newUserProfile, error: createError } = await supabase
        .from('users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          avatar_url: user.user_metadata?.avatar_url || null,
          tier: 'erigga_citizen',
          coins: 100,
          points: 0,
          level: 1,
          reputation_score: 0,
          is_active: true,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, username, full_name, avatar_url, tier')
        .single()

      if (createError || !newUserProfile) {
        console.error("Failed to create user profile:", createError)
        // Return mock response if database fails
        return NextResponse.json({
          success: true,
          post: {
            id: Date.now(),
            title: sanitizedTitle,
            content: sanitizedContent,
            user_id: user.id,
            category_id: category_id || 1,
            vote_count: 0,
            comment_count: 0,
            hashtags: hashtags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: {
              id: user.id,
              username: user.email?.split('@')[0] || 'user',
              full_name: user.user_metadata?.full_name || 'User',
              avatar_url: user.user_metadata?.avatar_url || null,
              tier: 'erigga_citizen'
            },
            category: {
              id: category_id || 1,
              name: "General Discussion",
              color: "#3B82F6",
              icon: "💬"
            },
            user_voted: false
          },
          isDemo: true
        })
      }

      userProfile = newUserProfile
    }

    // Try to create real post in Supabase
    const { data: newPost, error: postError } = await supabase
      .from('community_posts')
      .insert({
        user_id: userProfile.id,
        title: sanitizedTitle,
        content: sanitizedContent,
        category_id: category_id || null,
        hashtags: hashtags || []
      })
      .select(`
        id,
        title,
        content,
        media_url,
        vote_count,
        comment_count,
        hashtags,
        created_at,
        updated_at
      `)
      .single()

    if (postError) {
      console.log("Supabase post creation failed, returning mock data:", postError.message)

      // Return mock data if Supabase fails
      const mockPost = {
        id: Date.now(),
        title: sanitizedTitle,
        content: sanitizedContent,
        user_id: user.id,
        category_id: category_id || 1,
        vote_count: 0,
        comment_count: 0,
        hashtags: hashtags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: user.user_metadata?.avatar_url || '/placeholder-user.jpg',
          tier: 'erigga_citizen'
        },
        category: {
          id: 1,
          name: "General Discussion",
          color: "#3B82F6",
          icon: "💬"
        }
      }

      return NextResponse.json({
        success: true,
        post: mockPost,
        isDemo: true
      })
    }

    // Get category information
    let categoryInfo = {
      id: 1,
      name: "General Discussion",
      color: "#3B82F6",
      icon: "💬"
    }

    if (category_id) {
      const { data: category } = await supabase
        .from('community_categories')
        .select('id, name, color, icon')
        .eq('id', category_id)
        .single()

      if (category) {
        categoryInfo = category
      }
    }

    // Format response with user and category info
    const responsePost = {
      ...newPost,
      user: userProfile,
      category: categoryInfo,
      user_voted: false
    }

    return NextResponse.json({
      success: true,
      post: responsePost
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
  }
}