"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types for better type safety
interface ActionResult<T = any> {
  success: boolean
  error?: string
  data?: T
}

// Helper function to get user's internal ID
async function getUserInternalId() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    throw new Error("Authentication required")
  }

  // Try to get user's internal ID from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .or(`auth_user_id.eq.${authUser.id},id.eq.${authUser.id}`)
    .single()

  if (userError || !userData) {
    throw new Error("User profile not found")
  }

  return { authUser, internalUserId: userData.id }
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
export async function createPost(formData: FormData) {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    // Extract form data
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!content?.trim()) {
      throw new Error("Content is required")
    }

    // Extract hashtags from content
    const hashtags = extractHashtags(content)

    // Insert the post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: internalUserId,
        content: content.trim(),
        category_id: categoryId ? Number.parseInt(categoryId) : null,
        hashtags: hashtags.length > 0 ? hashtags : null,
        is_published: true,
      })
      .select(`
        id,
        content,
        created_at,
        hashtags,
        vote_count,
        comment_count
      `)
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      throw new Error("Failed to create post")
    }

    // Update category post count if category was specified
    if (categoryId) {
      await supabase.rpc("increment_category_post_count", {
        category_id: Number.parseInt(categoryId),
      })
    }

    // Update user's post count
    await supabase.rpc("increment_user_post_count", {
      user_id: internalUserId,
    })

    revalidatePath("/community/working")
    return { success: true, data: post }
  } catch (error) {
    console.error("Create post error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create post")
  }
}

/**
 * Vote on a post
 */
export async function voteOnPost(postId: number) {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    if (!postId || postId <= 0) {
      throw new Error("Invalid post ID")
    }

    // Check if user has already voted on this post
    const { data: existingVote, error: voteCheckError } = await supabase
      .from("community_votes")
      .select("id")
      .eq("user_id", internalUserId)
      .eq("post_id", postId)
      .single()

    if (voteCheckError && voteCheckError.code !== "PGRST116") {
      console.error("Vote check error:", voteCheckError)
      throw new Error("Failed to check vote status")
    }

    let voted = false
    let newVoteCount = 0

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_votes")
        .delete()
        .eq("user_id", internalUserId)
        .eq("post_id", postId)

      if (deleteError) {
        console.error("Vote delete error:", deleteError)
        throw new Error("Failed to remove vote")
      }

      // Decrement vote count
      const { data: updatedPost, error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.raw("vote_count - 1") })
        .eq("id", postId)
        .select("vote_count")
        .single()

      if (updateError) {
        console.error("Vote count update error:", updateError)
      } else {
        newVoteCount = updatedPost.vote_count || 0
      }

      voted = false
    } else {
      // Add vote
      const { error: insertError } = await supabase.from("community_votes").insert({
        user_id: internalUserId,
        post_id: postId,
        vote_type: "upvote",
      })

      if (insertError) {
        console.error("Vote insert error:", insertError)
        throw new Error("Failed to add vote")
      }

      // Increment vote count
      const { data: updatedPost, error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.raw("vote_count + 1") })
        .eq("id", postId)
        .select("vote_count")
        .single()

      if (updateError) {
        console.error("Vote count update error:", updateError)
      } else {
        newVoteCount = updatedPost.vote_count || 0
      }

      voted = true
    }

    revalidatePath("/community/working")
    return { success: true, voted, newVoteCount }
  } catch (error) {
    console.error("Vote on post error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to process vote")
  }
}

/**
 * Toggle bookmark status for a post
 */
export async function bookmarkPost(postId: number) {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    if (!postId || postId <= 0) {
      throw new Error("Invalid post ID")
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
      throw new Error("Failed to check bookmark status")
    }

    let bookmarked = false

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", internalUserId)
        .eq("post_id", postId)

      if (deleteError) {
        console.error("Bookmark delete error:", deleteError)
        throw new Error("Failed to remove bookmark")
      }
      bookmarked = false
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: internalUserId,
        post_id: postId,
      })

      if (insertError) {
        console.error("Bookmark insert error:", insertError)
        throw new Error("Failed to add bookmark")
      }
      bookmarked = true
    }

    revalidatePath("/community/working")
    return { success: true, bookmarked }
  } catch (error) {
    console.error("Bookmark post error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to process bookmark")
  }
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: number, content: string, parentCommentId?: number) {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    if (!postId || postId <= 0) {
      throw new Error("Invalid post ID")
    }

    if (!content?.trim()) {
      throw new Error("Comment content is required")
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      throw new Error("Post not found")
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
        throw new Error("Parent comment not found")
      }
    }

    // Insert the comment
    const { data: comment, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: internalUserId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
      })
      .select(`
        id,
        content,
        created_at,
        parent_comment_id
      `)
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      throw new Error("Failed to create comment")
    }

    // Update post comment count
    await supabase.rpc("increment_post_comment_count", {
      p_post_id: postId,
    })

    revalidatePath("/community/working")
    return { success: true, data: comment }
  } catch (error) {
    console.error("Add comment error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to add comment")
  }
}

/**
 * Fetch community posts with filters and pagination
 */
export async function fetchCommunityPosts(
  userId?: string,
  options: {
    categoryFilter?: number
    sortOrder?: string
    page?: number
    limit?: number
    searchQuery?: string
  } = {},
) {
  try {
    const supabase = await createClient()
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        users!inner (
          id,
          username,
          full_name,
          avatar_url,
          tier,
          reputation_score
        ),
        community_categories (
          name,
          slug,
          color
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)

    // Apply category filter
    if (categoryFilter) {
      query = query.eq("category_id", categoryFilter)
    }

    // Apply search filter
    if (searchQuery?.trim()) {
      query = query.ilike("content", `%${searchQuery.trim()}%`)
    }

    // Apply sorting
    switch (sortOrder) {
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false })
        break
      case "newest":
      default:
        query = query.order("created_at", { ascending: false })
        break
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: posts, error } = await query

    if (error) {
      console.error("Fetch posts error:", error)
      return { success: false, error: "Failed to fetch posts", posts: [] }
    }

    return { success: true, posts: posts || [] }
  } catch (error) {
    console.error("Fetch community posts error:", error)
    return { success: false, error: "Failed to fetch posts", posts: [] }
  }
}
