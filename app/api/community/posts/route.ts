<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const sortBy = searchParams.get("sortBy") || "newest"
    const limit = parseInt(searchParams.get("limit") || "20")

    const supabase = createClientComponentClient()

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        user:user_profiles!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", parseInt(categoryId))
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        query = query.order("created_at", { ascending: false })
        break
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    query = query.limit(limit)

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
=======
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
>>>>>>> new
  }
}

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
    const supabase = createClientComponentClient()

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    // Validate content for URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(content)) {
      return NextResponse.json({ error: "Posts cannot contain external links or URLs" }, { status: 400 })
    }

    const postData = {
      user_id: userProfile.id,
      category_id: parseInt(categoryId),
      content: content.trim(),
      is_published: true,
      is_deleted: false,
    }

    const { data: newPost, error: insertError } = await supabase
      .from("community_posts")
      .insert(postData)
      .select(`
        *,
        user:user_profiles!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (insertError) {
      console.error("Error creating post:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    revalidatePath("/community")
    return NextResponse.json({ success: true, post: newPost })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
=======
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
>>>>>>> new
  }
}
