import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Post types
export type PostWithUser = {
  id: number
  content: string
  type: string
  media_urls: string[]
  media_types: string[]
  thumbnail_urls: string[]
  like_count: number
  comment_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    avatar_url: string | null
    tier: string
  }
}

export type BarSubmission = {
  id: number
  content: string
  audio_url?: string
  vote_count: number
  user_id: number
  created_at: string
  user: {
    username: string
    full_name: string
    avatar_url: string | null
    tier: string
  }
}

// Client-side database operations
export const clientDb = {
  // Fetch community posts
  async getPosts(category?: string, limit = 10, page = 1) {
    const supabase = createClient()
    const startIndex = (page - 1) * limit

    let query = supabase
      .from("posts")
      .select(`
        id, 
        content, 
        type, 
        media_urls, 
        media_types, 
        thumbnail_urls, 
        like_count, 
        comment_count, 
        created_at,
        user_id,
        users:user_id (
          id, 
          username, 
          full_name, 
          avatar_url, 
          tier
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(startIndex, startIndex + limit - 1)

    if (category && category !== "all") {
      query = query.eq("type", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return { posts: [], error: error.message }
    }

    // Transform the data to match our PostWithUser type
    const posts: PostWithUser[] =
      data?.map((post) => ({
        id: post.id,
        content: post.content,
        type: post.type,
        media_urls: post.media_urls || [],
        media_types: post.media_types || [],
        thumbnail_urls: post.thumbnail_urls || [],
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at,
        user: post.users,
      })) || []

    return { posts, error: null }
  },

  // Fetch bars submissions
  async getBars(limit = 10, page = 1) {
    const supabase = createClient()
    const startIndex = (page - 1) * limit

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id, 
        content, 
        media_urls, 
        vote_count:like_count, 
        created_at,
        user_id,
        users:user_id (
          username, 
          full_name, 
          avatar_url, 
          tier
        )
      `)
      .eq("type", "bars")
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("like_count", { ascending: false })
      .range(startIndex, startIndex + limit - 1)

    if (error) {
      console.error("Error fetching bars:", error)
      return { bars: [], error: error.message }
    }

    // Transform the data to match our BarSubmission type
    const bars: BarSubmission[] =
      data?.map((bar) => ({
        id: bar.id,
        content: bar.content,
        audio_url: bar.media_urls?.[0],
        vote_count: bar.vote_count || 0,
        user_id: bar.user_id,
        created_at: bar.created_at,
        user: bar.users,
      })) || []

    return { bars, error: null }
  },

  // Get top bars of the week
  async getTopBarsOfWeek(limit = 5) {
    const supabase = createClient()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id, 
        content, 
        media_urls, 
        vote_count:like_count, 
        created_at,
        user_id,
        users:user_id (
          username, 
          full_name, 
          avatar_url, 
          tier
        )
      `)
      .eq("type", "bars")
      .eq("is_published", true)
      .eq("is_deleted", false)
      .gte("created_at", oneWeekAgo.toISOString())
      .order("like_count", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching top bars:", error)
      return { topBars: [], error: error.message }
    }

    // Transform the data to match our BarSubmission type
    const topBars: BarSubmission[] =
      data?.map((bar) => ({
        id: bar.id,
        content: bar.content,
        audio_url: bar.media_urls?.[0],
        vote_count: bar.vote_count || 0,
        user_id: bar.user_id,
        created_at: bar.created_at,
        user: bar.users,
      })) || []

    return { topBars, error: null }
  },

  // Get top contributors (leaderboard)
  async getTopContributors(limit = 10) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        tier,
        points,
        level
      `)
      .order("points", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching top contributors:", error)
      return { contributors: [], error: error.message }
    }

    return { contributors: data || [], error: null }
  },

  // Vote on a bar
  async voteOnBar(postId: number, userId: number, coinAmount = 1) {
    const supabase = createClient()

    try {
      // Start a transaction-like operation
      // 1. Check if user has enough coins
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("coins")
        .eq("id", userId)
        .single()

      if (userError || !userData) {
        console.error("Error fetching user data:", userError)
        return { success: false, error: userError?.message || "User not found" }
      }

      if (userData.coins < coinAmount) {
        return { success: false, error: "Not enough coins" }
      }

      // 2. Update post like_count
      const { error: postError } = await supabase.rpc("increment_post_likes", {
        post_id: postId,
        increment_by: coinAmount,
      })

      if (postError) {
        console.error("Error updating post:", postError)
        return { success: false, error: postError.message }
      }

      // 3. Create coin transaction
      const { error: transactionError } = await supabase.from("coin_transactions").insert({
        user_id: userId,
        amount: -coinAmount,
        transaction_type: "content_access",
        status: "completed",
        description: `Voted on bar post #${postId}`,
        fee_amount: 0,
        currency: "NGN",
        exchange_rate: 1,
        metadata: { post_id: postId },
      })

      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        return { success: false, error: transactionError.message }
      }

      // 4. Update user's coin balance
      const { error: updateUserError } = await supabase
        .from("users")
        .update({ coins: userData.coins - coinAmount })
        .eq("id", userId)

      if (updateUserError) {
        console.error("Error updating user coins:", updateUserError)
        return { success: false, error: updateUserError.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Unexpected error in voteOnBar:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  // Create a new post
  async createPost(userId: number, content: string, type: string, mediaUrls: string[] = [], mediaTypes: string[] = []) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content,
        type,
        media_urls: mediaUrls,
        media_types: mediaTypes,
        thumbnail_urls: [],
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
        is_featured: false,
        is_pinned: false,
        is_published: true,
        is_deleted: false,
        tags: [],
        mentions: [],
        hashtags: [],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return { post: null, error: error.message }
    }

    return { post: data, error: null }
  },
}

// Server-side database operations
export const serverDb = {
  // Similar functions but using createServerClient
  async getPosts(category?: string, limit = 10, page = 1) {
    const supabase = await createServerClient()
    const startIndex = (page - 1) * limit

    let query = supabase
      .from("posts")
      .select(`
        id, 
        content, 
        type, 
        media_urls, 
        media_types, 
        thumbnail_urls, 
        like_count, 
        comment_count, 
        created_at,
        user_id,
        users:user_id (
          id, 
          username, 
          full_name, 
          avatar_url, 
          tier
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(startIndex, startIndex + limit - 1)

    if (category && category !== "all") {
      query = query.eq("type", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return { posts: [], error: error.message }
    }

    // Transform the data to match our PostWithUser type
    const posts: PostWithUser[] =
      data?.map((post) => ({
        id: post.id,
        content: post.content,
        type: post.type,
        media_urls: post.media_urls || [],
        media_types: post.media_types || [],
        thumbnail_urls: post.thumbnail_urls || [],
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at,
        user: post.users,
      })) || []

    return { posts, error: null }
  },
}
