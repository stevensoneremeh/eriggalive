import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Get sample posts for now
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
      posts: samplePosts
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

    // For now, just return success with mock data
    const newPost = {
      id: Date.now(),
      title,
      content,
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
      post: newPost
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
  }
}
