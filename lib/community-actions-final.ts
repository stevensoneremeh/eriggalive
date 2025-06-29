"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPost(content: string, categoryId?: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        category_id: categoryId || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, post }
  } catch (error) {
    console.error("Error in createPost:", error)
    return { success: false, error: "Failed to create post" }
  }
}

export async function voteOnPost(postId: number, voteType: "up" | "down") {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("post_votes")
      .select("vote_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if same type
        await supabase.from("post_votes").delete().eq("post_id", postId).eq("user_id", user.id)
      } else {
        // Update vote type
        await supabase.from("post_votes").update({ vote_type: voteType }).eq("post_id", postId).eq("user_id", user.id)
      }
    } else {
      // Create new vote
      await supabase.from("post_votes").insert({
        post_id: postId,
        user_id: user.id,
        vote_type: voteType,
      })
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in voteOnPost:", error)
    return { success: false, error: "Failed to vote on post" }
  }
}

export async function bookmarkPost(postId: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("post_bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", user.id)
    } else {
      // Add bookmark
      await supabase.from("post_bookmarks").insert({
        post_id: postId,
        user_id: user.id,
      })
    }

    revalidatePath("/community")
    return { success: true, bookmarked: !existingBookmark }
  } catch (error) {
    console.error("Error in bookmarkPost:", error)
    return { success: false, error: "Failed to bookmark post" }
  }
}
