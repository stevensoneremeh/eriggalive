"use server"

import { createClient } from "@/lib/supabase/server-final"
import { revalidatePath } from "next/cache"

export async function createPost(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User profile not found" }
    }

    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!content || !categoryId) {
      return { success: false, error: "Content and category are required" }
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
      console.error("Post creation error:", postError)
      return { success: false, error: "Failed to create post" }
    }

    revalidatePath("/community")
    return { success: true, post }
  } catch (error) {
    console.error("Error creating post:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function voteOnPost(postId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Call the vote function
    const { data, error } = await supabase.rpc("handle_post_vote", {
      p_post_id: postId,
      p_voter_auth_id: user.id,
      p_coin_amount: 100,
    })

    if (error) {
      console.error("Vote error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, voted: data }
  } catch (error) {
    console.error("Error voting on post:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function bookmarkPost(postId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User profile not found" }
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
    return { success: false, error: "An unexpected error occurred" }
  }
}
