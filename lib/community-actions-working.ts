"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ActionResult {
  success: boolean
  message?: string
  data?: any
  error?: string
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  // Get internal user ID
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (userError || !userData) {
    // Fallback: try to find by id directly
    const { data: fallbackUser, error: fallbackError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (fallbackError || !fallbackUser) {
      throw new Error("User profile not found")
    }
    return { authUser: user, internalUserId: fallbackUser.id }
  }

  return { authUser: user, internalUserId: userData.id }
}

// Helper function to extract hashtags from content
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = content.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.toLowerCase()) : []
}

/**
 * Create a new community post
 */
export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const { authUser, internalUserId } = await getAuthenticatedUser()
    const supabase = createClient()

    // Extract form data
    const content = formData.get("content") as string
    const category = (formData.get("category") as string) || "general"
    const mediaFile = formData.get("media") as File | null

    if (!content?.trim()) {
      return { success: false, error: "Content is required" }
    }

    // Extract hashtags from content
    const hashtags = extractHashtags(content)

    // Handle media upload
    let mediaUrl = null
    let mediaType = null

    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `community/${internalUserId}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("media").upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return { success: false, error: "Failed to upload media" }
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath)

      mediaUrl = publicUrl
      mediaType = mediaFile.type.startsWith("image/") ? "image" : mediaFile.type.startsWith("video/") ? "video" : "file"
    }

    // Insert the post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: internalUserId,
        content,
        category,
        hashtags,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      return { success: false, error: "Failed to create post" }
    }

    // Update category count
    await supabase.rpc("increment_category_count", { category_name: category })

    // Update user post count
    await supabase.rpc("increment_user_post_count", { user_id: internalUserId })

    revalidatePath("/community")
    return { success: true, message: "Post created successfully", data: post }
  } catch (error) {
    console.error("Create post error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create post" }
  }
}

/**
 * Vote on a post
 */
export async function voteOnPost(postId: number): Promise<ActionResult> {
  try {
    const { authUser, internalUserId } = await getAuthenticatedUser()
    const supabase = createClient()

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    // Call the safe vote handling RPC
    const { data, error } = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_user_id: internalUserId,
      p_vote_cost: 100,
    })

    if (error) {
      console.error("Vote error:", error)
      return { success: false, error: "Failed to process vote" }
    }

    revalidatePath("/community")
    return {
      success: true,
      message: data?.message || "Vote processed",
      data: {
        voted: data?.voted || false,
        voteCount: data?.vote_count || 0,
      },
    }
  } catch (error) {
    console.error("Vote post error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to vote" }
  }
}

/**
 * Toggle bookmark status for a post
 */
export async function bookmarkPost(postId: number): Promise<ActionResult> {
  try {
    const { authUser, internalUserId } = await getAuthenticatedUser()
    const supabase = createClient()

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    // Check if bookmark exists
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

    let isBookmarked = false

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase.from("user_bookmarks").delete().eq("id", existingBookmark.id)

      if (deleteError) {
        console.error("Bookmark delete error:", deleteError)
        return { success: false, error: "Failed to remove bookmark" }
      }
      isBookmarked = false
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: internalUserId,
        post_id: postId,
        created_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Bookmark insert error:", insertError)
        return { success: false, error: "Failed to add bookmark" }
      }
      isBookmarked = true
    }

    revalidatePath("/community")
    return {
      success: true,
      message: isBookmarked ? "Post bookmarked" : "Bookmark removed",
      data: { bookmarked: isBookmarked },
    }
  } catch (error) {
    console.error("Bookmark post error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to bookmark" }
  }
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: number, content: string, parentCommentId?: number): Promise<ActionResult> {
  try {
    const { authUser, internalUserId } = await getAuthenticatedUser()
    const supabase = createClient()

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    if (!content?.trim()) {
      return { success: false, error: "Comment content is required" }
    }

    // Create comment
    const { data: commentData, error: commentError } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: internalUserId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      return { success: false, error: "Failed to create comment" }
    }

    // Update post comment count
    await supabase.rpc("increment_post_comment_count", { post_id: postId })

    revalidatePath("/community")
    return { success: true, message: "Comment added successfully", data: commentData }
  } catch (error) {
    console.error("Add comment error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add comment" }
  }
}

/**
 * Fetch community posts with filters and pagination
 */
export async function fetchCommunityPosts(
  userId?: string,
  options: {
    category?: string
    limit?: number
    offset?: number
    sortBy?: "newest" | "popular" | "trending"
  } = {},
): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { category, limit = 20, offset = 0, sortBy = "newest" } = options

    let query = supabase.from("community_posts").select(`
        *,
        users!community_posts_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          tier
        ),
        post_votes (
          user_id,
          created_at
        ),
        post_comments (
          id,
          content,
          created_at,
          users!post_comments_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        ),
        user_bookmarks (
          user_id
        )
      `)

    // Apply category filter
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    // Apply sorting
    switch (sortBy) {
      case "popular":
        query = query.order("vote_count", { ascending: false })
        break
      case "trending":
        query = query.order("engagement_score", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error } = await query

    if (error) {
      console.error("Fetch posts error:", error)
      return { success: false, error: "Failed to fetch posts" }
    }

    return { success: true, data: posts || [] }
  } catch (error) {
    console.error("Fetch community posts error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch posts" }
  }
}
