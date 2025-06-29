"use server"

/**
 * Community-related Server Actions
 * --------------------------------
 *  • createCommunityPostAction      – create a new post
 *  • voteOnPostAction / voteOnPost  – up- or down-vote a post
 *  • bookmarkPost                   – toggle bookmark on a post
 *  • fetchCommunityPosts            – paginated post query for feeds
 *  • fetchCommentsForPost           – comments for a post
 *  • createCommentAction            – add comment
 *  • editCommentAction              – edit comment
 *  • deleteCommentAction            – delete comment
 *  • toggleLikeCommentAction        – like/unlike a comment
 *  • createReportAction             – report inappropriate content
 *  • searchUsersForMention          – autocomplete @mentions
 *
 *  Aliases kept for backwards-compatibility:
 *    • voteOnPost  (alias of voteOnPostAction)
 *    • createPost  (alias of createCommunityPostAction)
 *    • bookmarkPostAction (alias of bookmarkPost)
 */

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get user's internal ID from the users table
 */
async function getUserInternalId(authUserId: string) {
  const supabase = await createClient()

  // First try auth_user_id column
  let { data: user } = await supabase.from("users").select("id").eq("auth_user_id", authUserId).single()

  // Fallback to id column if auth_user_id doesn't exist or match
  if (!user) {
    const { data: fallbackUser } = await supabase.from("users").select("id").eq("id", authUserId).single()
    user = fallbackUser
  }

  return user?.id
}

/* ------------------------------------------------------------------------ */
/*                               POST ACTIONS                               */
/* ------------------------------------------------------------------------ */

export async function createCommunityPostAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user's internal ID
    const internalUserId = await getUserInternalId(user.id)
    if (!internalUserId) {
      return { success: false, error: "User profile not found" }
    }

    // Extract form data
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const mediaFile = formData.get("mediaFile") as File | null

    if (!content?.trim() && !mediaFile) {
      return { success: false, error: "Post content or media is required" }
    }

    if (!categoryId) {
      return { success: false, error: "Category is required" }
    }

    // Extract hashtags from content
    const hashtagMatches = content?.match(/#\w+/g) || []
    const hashtags = hashtagMatches.map(tag => tag.slice(1))

    // Handle media upload if present
    let mediaUrl: string | null = null
    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split('.').pop()
      const fileName = `${internalUserId}-${Date.now()}.${fileExt}`
      const filePath = `community_media/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("community-assets")
        .upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Media upload error:", uploadError)
        return { success: false, error: "Failed to upload media" }
      }

      const { data: publicUrlData } = supabase.storage
        .from("community-assets")
        .getPublicUrl(uploadData.path)
      
      mediaUrl = publicUrlData.publicUrl
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: internalUserId,
        category_id: Number.parseInt(categoryId),
        content: content?.trim() || "",
        media_url: mediaUrl,
        hashtags,
        is_published: true
      })
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      return { success: false, error: "Failed to create post" }
    }

    revalidatePath("/community")
    return { success: true, data: post }

  } catch (error) {
    console.error("Create post action error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
}

/* Back-compat alias */
const createPost = createCommunityPostAction

/* ----------------------------- vote on post ----------------------------- */

async function voteOnPostAction(postId: number, coinAmount = 100): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user's internal ID
    const internalUserId = await getUserInternalId(user.id)
    if (!internalUserId) {
      return { success: false, error: "User profile not found" }
    }

    // Get post details to find the creator
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("user_id, users!inner(auth_user_id)")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return { success: false, error: "Post not found" }
    }

    // Prevent self-voting
    if (post.user_id === internalUserId) {
      return { success: false, error: "Cannot vote on your own post" }
    }

    // Call the RPC function
    const { data: result, error: rpcError } = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_voter_auth_id: user.id,
      p_post_creator_auth_id: (post.users as any).auth_user_id,
      p_coin_amount: coinAmount
    })

    if (rpcError) {
      console.error("Vote RPC error:", rpcError)
      return { success: false, error: rpcError.message }
    }

    revalidatePath("/community")
    return { 
      success: true, 
      data: { 
        voted: result,
        message: `Vote successful! ${coinAmount} coins transferred.`
      }
    }

  } catch (error) {
    console.error("Vote action error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

/* alias expected by older code */
export const voteOnPost = voteOnPostAction

/* -------------------------- bookmark a post ----------------------------- */

export async function bookmarkPostAction(postId: number): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user's internal ID
    const internalUserId = await getUserInternalId(user.id)
    if (!internalUserId) {
      return { success: false, error: "User profile not found" }
    }

    // Check if bookmark already exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", internalUserId)
      .eq("post_id", postId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Bookmark check error:", checkError)
      return { success: false, error: "Failed to check bookmark status" }
    }

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("id", existingBookmark.id)

      if (deleteError) {
        console.error("Bookmark removal error:", deleteError)
        return { success: false, error: "Failed to remove bookmark" }
      }

      revalidatePath("/community")
      return { success: true, data: { bookmarked: false, action: "removed" } }
    } else {
      // Add bookmark
      const { error: insertError } = await supabase
        .from("user_bookmarks")
        .insert({
          user_id: internalUserId,
          post_id: postId
        })

      if (insertError) {
        console.error("Bookmark creation error:", insertError)
        return { success: false, error: "Failed to add bookmark" }
      }

      revalidatePath("/community")
      return { success: true, data: { bookmarked: true, action: "added" } }
    }

  } catch (error) {
    console.error("Bookmark action error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

/* alias kept for older import paths */
export const bookmarkPost = bookmarkPostAction

/* ----------------------- feed / infinite query -------------------------- */

export async function fetchCommunityPosts(
  loggedInAuthUserId?: string | null,
  options: {
    categoryFilter?: number
    sortOrder?: "newest" | "oldest" | "top"
    page?: number
    limit?: number
    searchQuery?: string
  } = {}
): Promise<ActionResult> {
  try {
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options
    const supabase = await createClient()
    const offset = (page - 1) * limit

    let loggedInUserInternalId: number | undefined
    if (loggedInAuthUserId) {
      loggedInUserInternalId = await getUserInternalId(loggedInAuthUserId)
    }

    let query = supabase
      .from("community_posts")
      .select(`
        id, content, created_at, vote_count, comment_count, view_count, media_url, hashtags,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug),
        votes:post_votes(user_id)
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (categoryFilter) query = query.eq("category_id", categoryFilter)
    if (searchQuery) query = query.ilike("content", `%${searchQuery}%`)

    switch (sortOrder) {
      case "newest":
        query = query.order("created_at", { ascending: false })
        break
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return { success: false, error: error.message }
    }

    const postsWithVoteStatus = (data || []).map((post: any) => ({
      ...post,
      user: post.user || { username: "Unknown", avatar_url: null, tier: "grassroot" },
      category: post.category || { name: "General", slug: "general" },
      has_voted: loggedInUserInternalId
        ? post.votes.some((vote: any) => vote.user_id === loggedInUserInternalId)
        : false,
    }))

    return { success: true, data: postsWithVoteStatus }

  } catch (error) {
    console.error("Fetch posts error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

/* ------------------------------------------------------------------------ */
/*                              COMMENT ACTIONS                             */
/* ------------------------------------------------------------------------ */

export async function fetchCommentsForPost(postId: number): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Fetch comments error:", error)
      return { success: false, error: "Failed to fetch comments" }
    }

    return { success: true, data: comments || [] }

  } catch (error) {
    console.error("Fetch comments action error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

export async function createCommentAction(
  postId: number, 
  content: string, 
  parentCommentId?: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user's internal ID
    const internalUserId = await getUserInternalId(user.id)
    if (!internalUserId) {
      return { success: false, error: "User profile not found" }
    }

    // Validate content
    if (!content?.trim()) {
      return { success: false, error: "Comment content is required" }
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return { success: false, error: "Post not found" }
    }

    // If replying to a comment, verify parent comment exists
    if (parentCommentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from("community_comments")
        .select("id")
        .eq("id", parentCommentId)
        .eq("post_id", postId)
        .single()

      if (parentError || !parentComment) {
        return { success: false, error: "Parent comment not found" }
      }
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: internalUserId,
        parent_id: parentCommentId || null,
        content: content.trim()
      })
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
      `)
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      return { success: false, error: "Failed to create comment" }
    }

    // Update comment count on the post
    const { error: updateError } = await supabase
      .from("community_posts")
      .update({ 
        comment_count: supabase.sql`comment_count + 1` 
      })
      .eq("id", postId)

    if (updateError) {
      console.error("Comment count update error:", updateError)
      // Don't fail the entire operation for this
    }

    revalidatePath("/community")
    return { success: true, data: comment }

  } catch (error) {
    console.error("Create comment action error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}

export async function editCommentAction(commentId: number, content: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("community_comments")
    .update({ content: content.trim(), is_edited: true })
    .eq("id", commentId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteCommentAction(commentId: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("community_comments").update({ is_deleted: true }).eq("id", commentId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function toggleLikeCommentAction(commentId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Authentication required" }

  const { data: existing } = await supabase
    .from("community_comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from("community_comment_likes").delete().eq("id", existing.id)
    return { success: true, liked: false }
  }

  await supabase.from("community_comment_likes").insert({ comment_id: commentId, user_id: user.id })
  return { success: true, liked: true }
}

/* ------------------------------------------------------------------------ */
/*                         REPORTS & MENTION SEARCH                          */
/* ------------------------------------------------------------------------ */

export async function createReportAction(postId: number, reason: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Authentication required" }

  const { error } = await supabase.from("community_post_reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason: reason.trim(),
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function searchUsersForMention(query: string) {
  if (!query.trim()) return { success: true, users: [] }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url")
    .ilike("username", `%${query}%`)
    .limit(10)
  if (error) return { success: false, error: error.message }
  return { success: true, users: data ?? [] }
}

export { createPost }
