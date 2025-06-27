"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  deletePost as deletePostImpl,
  editPost as editPostImpl,
  reportPost as reportPostImpl,
  followUser as followUserImpl,
  unfollowUser as unfollowUserImpl,
} from "./community-actions-final-fix"

// All exports must be async functions in "use server" files
export async function createPost(formData: FormData) {
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
      const { data: standardUser } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

      if (standardUser) {
        userData = standardUser
      } else {
        // Fallback: try direct match with user ID
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

    revalidatePath("/community")
    return { success: true, post }
  } catch (error) {
    console.error("Error creating post:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function voteOnPost(postId: number) {
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
      p_coin_amount: 100,
    })

    if (error) {
      console.error("Vote error:", error)
      throw new Error(error.message)
    }

    if (!data.success) {
      throw new Error(data.error || "Vote failed")
    }

    revalidatePath("/community")
    return { success: true, voted: data.voted, action: data.action }
  } catch (error) {
    console.error("Error voting on post:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function bookmarkPost(postId: number) {
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

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", userData.id)
      .eq("post_id", postId)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      await supabase.from("user_bookmarks").delete().eq("user_id", userData.id).eq("post_id", postId)

      return { success: true, bookmarked: false }
    } else {
      // Add bookmark
      await supabase.from("user_bookmarks").insert({
        user_id: userData.id,
        post_id: postId,
      })

      return { success: true, bookmarked: true }
    }
  } catch (error) {
    console.error("Error bookmarking post:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function createComment(postId: string, content: string, parentId?: string) {
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
        post_id: Number.parseInt(postId),
        user_id: userData.id,
        parent_comment_id: parentId ? Number.parseInt(parentId) : null,
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
      .eq("id", Number.parseInt(postId))

    revalidatePath("/community")
    return { success: true, comment }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deletePost(postId: string) {
  return await deletePostImpl(postId)
}

export async function editPost(postId: string, content: string) {
  return await editPostImpl(postId, content)
}

export async function reportPost(postId: string, reason: string) {
  return await reportPostImpl(postId, reason)
}

export async function followUser(userId: string) {
  return await followUserImpl(userId)
}

export async function unfollowUser(userId: string) {
  return await unfollowUserImpl(userId)
}

// Legacy aliases for backward compatibility
export async function createPostAction(formData: FormData) {
  return await createPost(formData)
}

export async function voteOnPostAction(postId: string, voteType: "up" | "down") {
  return await voteOnPost(Number.parseInt(postId))
}

export async function bookmarkPostAction(postId: string) {
  return await bookmarkPost(Number.parseInt(postId))
}
