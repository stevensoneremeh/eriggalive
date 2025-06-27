"use server"

import { createClient } from "@/lib/supabase/server"
import { bookmarkPostAction } from "./community-actions-final-fix"
import { VOTE_COIN_AMOUNT } from "./community-actions-final-fix" // Declare the variable before using it

export async function createCommunityPostAction(formData: FormData) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error("Authentication required")
    }

    // Get user's internal ID - check both possible table structures
    let userData
    try {
      // First try the standard users table
      const { data: standardUser, error: standardError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()

      if (standardUser) {
        userData = standardUser
      } else {
        // Fallback: try direct match with user ID
        const { data: directUser, error: directError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single()

        if (directUser) {
          userData = directUser
        } else {
          throw new Error("User profile not found")
        }
      }
    } catch (error) {
      throw new Error("User profile not found")
    }

    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!content || !categoryId) {
      throw new Error("Content and category are required")
    }

    // Extract hashtags from content
    const hashtagMatches = content.match(/#\w+/g)
    const hashtags = hashtagMatches ? hashtagMatches.map((tag) => tag.slice(1)) : []

    // Create post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userData.id,
        category_id: Number.parseInt(categoryId),
        content,
        hashtags,
      })
      .select()
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      throw new Error("Failed to create post")
    }

    // Update user post count
    await supabase
      .from("users")
      .update({
        posts_count: supabase.raw("COALESCE(posts_count, 0) + 1"),
        total_posts: supabase.raw("COALESCE(total_posts, 0) + 1"),
      })
      .eq("id", userData.id)

    // Update category post count
    await supabase
      .from("community_categories")
      .update({
        post_count: supabase.raw("COALESCE(post_count, 0) + 1"),
      })
      .eq("id", Number.parseInt(categoryId))

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/community")
    return { success: true, post }
  } catch (error) {
    console.error("Error creating post:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function voteOnPostAction(postId: number, postCreatorAuthId?: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error("Authentication required")
    }

    // Get user's internal ID
    let userData
    try {
      const { data: standardUser } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

      if (standardUser) {
        userData = standardUser
      } else {
        const { data: directUser } = await supabase.from("users").select("id").eq("id", user.id).single()

        if (directUser) {
          userData = directUser
        } else {
          throw new Error("User profile not found")
        }
      }
    } catch (error) {
      throw new Error("User profile not found")
    }

    // Use the safe vote function
    const { data, error } = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_voter_id: userData.id,
      p_coin_amount: VOTE_COIN_AMOUNT,
      p_post_creator_auth_id: postCreatorAuthId,
    })

    if (error) {
      console.error("Vote error:", error)
      throw new Error(error.message)
    }

    if (!data.success) {
      throw new Error(data.error || "Vote failed")
    }

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/community")
    return { success: true, voted: data.voted, action: data.action }
  } catch (error) {
    console.error("Error voting on post:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function addComment(postId: number, content: string, parentCommentId?: number) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error("Authentication required")
    }

    // Get user's internal ID
    let userData
    try {
      const { data: standardUser } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

      if (standardUser) {
        userData = standardUser
      } else {
        const { data: directUser } = await supabase.from("users").select("id").eq("id", user.id).single()

        if (directUser) {
          userData = directUser
        } else {
          throw new Error("User profile not found")
        }
      }
    } catch (error) {
      throw new Error("User profile not found")
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: userData.id,
        parent_comment_id: parentCommentId,
        content,
      })
      .select()
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      throw new Error("Failed to create comment")
    }

    // Update post comment count
    await supabase
      .from("community_posts")
      .update({ comment_count: supabase.raw("COALESCE(comment_count, 0) + 1") })
      .eq("id", postId)

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/community")
    return { success: true, comment }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

const mod = () => import("./community-actions-final-fix")

export async function createPost(formData: FormData) {
  const { createCommunityPostAction } = await mod()
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId = "") {
  const { voteOnPostAction } = await mod()
  return voteOnPostAction(postId, postCreatorAuthId)
}

/* keep old “*Action” names alive */
export { bookmarkPostAction }

export async function fetchCommunityPosts(
  userId?: string,
  opts?: { categoryFilter?: number; sortOrder?: string; page?: number; limit?: number; searchQuery?: string },
) {
  const { fetchCommunityPosts } = await mod()
  return fetchCommunityPosts(userId, opts)
}
