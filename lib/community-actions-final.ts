"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      throw new Error("User profile not found")
    }

    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!content || !categoryId) {
      throw new Error("Content and category are required")
    }

    // Extract hashtags from content
    const hashtags = content.match(/#\w+/g)?.map((tag) => tag.slice(1)) || []

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
      throw new Error("Failed to create post")
    }

    // Update user post count
    await supabase
      .from("users")
      .update({
        posts_count: supabase.raw("posts_count + 1"),
        total_posts: supabase.raw("total_posts + 1"),
      })
      .eq("id", userData.id)

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

    // Call the vote function
    const { data, error } = await supabase.rpc("handle_post_vote", {
      p_post_id: postId,
      p_voter_auth_id: user.id,
      p_coin_amount: 100,
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath("/community")
    return { success: true, voted: data }
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
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
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
      throw new Error("Failed to create comment")
    }

    // Update post comment count
    await supabase
      .from("community_posts")
      .update({ comment_count: supabase.raw("comment_count + 1") })
      .eq("id", postId)

    revalidatePath("/community")
    return { success: true, comment }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function followUser(userId: number) {
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
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      throw new Error("User profile not found")
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", userData.id)
      .eq("following_id", userId)
      .single()

    if (existingFollow) {
      // Unfollow
      await supabase.from("user_follows").delete().eq("follower_id", userData.id).eq("following_id", userId)

      return { success: true, following: false }
    } else {
      // Follow
      await supabase.from("user_follows").insert({
        follower_id: userData.id,
        following_id: userId,
      })

      return { success: true, following: true }
    }
  } catch (error) {
    console.error("Error following user:", error)
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
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
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
