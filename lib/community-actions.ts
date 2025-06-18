"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { CommunityPost } from "@/types/database"

const VOTE_COIN_AMOUNT = 100

export async function createCommunityPostAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  const content = formData.get("content") as string
  const categoryId = formData.get("categoryId") as string
  const mediaFile = formData.get("mediaFile") as File | null

  // Basic validation
  if (!content || !categoryId) {
    return { success: false, error: "Content and category are required." }
  }

  let media_url: string | undefined = undefined
  let media_type: string | undefined = undefined
  let media_metadata: Record<string, any> | undefined = undefined

  if (mediaFile && mediaFile.size > 0) {
    // Media upload logic to Supabase Storage
    const fileExt = mediaFile.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `community_media/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("eriggalive-assets") // Ensure this bucket exists and has correct policies
      .upload(filePath, mediaFile)

    if (uploadError) {
      console.error("Media upload error:", uploadError)
      return { success: false, error: `Media upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)
    media_url = publicUrlData.publicUrl

    if (mediaFile.type.startsWith("image/")) media_type = "image"
    else if (mediaFile.type.startsWith("audio/")) media_type = "audio"
    else if (mediaFile.type.startsWith("video/")) media_type = "video"

    // Basic metadata, can be expanded (e.g. image dimensions, video duration)
    media_metadata = { name: mediaFile.name, size: mediaFile.size, type: mediaFile.type }
  }

  // @mentions and #tags parsing can be added here
  // For simplicity, not fully implemented in this step

  const postData: Omit<
    CommunityPost,
    | "id"
    | "vote_count"
    | "comment_count"
    | "created_at"
    | "updated_at"
    | "is_published"
    | "is_deleted"
    | "user"
    | "category"
    | "has_voted"
  > & { user_id: string } = {
    user_id: user.id,
    category_id: Number.parseInt(categoryId),
    content,
    media_url,
    media_type,
    media_metadata,
    // tags: [], // Parse from content
    // mentions: [], // Parse from content
  }

  const { data: newPost, error } = await supabase.from("community_posts").insert(postData).select().single()

  if (error) {
    console.error("Error creating post:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/community")
  return { success: true, post: newPost }
}

export async function voteOnPostAction(postId: number, postCreatorId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user: voter },
  } = await supabase.auth.getUser()

  if (!voter) {
    return { success: false, error: "User not authenticated", code: "UNAUTHENTICATED" }
  }

  if (voter.id === postCreatorId) {
    return { success: false, error: "You cannot vote on your own post.", code: "SELF_VOTE" }
  }

  // Use the Supabase function to handle the vote and coin transfer atomically
  const { data, error } = await supabase.rpc("handle_post_vote", {
    p_post_id: postId,
    p_voter_id: voter.id,
    p_post_creator_id: postCreatorId,
    p_coin_amount: VOTE_COIN_AMOUNT,
  })

  if (error) {
    console.error("Error in handle_post_vote RPC:", error)
    // Check for specific error messages from the function
    if (error.message.includes("Insufficient coins")) {
      return { success: false, error: "Not enough Erigga Coins to vote.", code: "INSUFFICIENT_FUNDS" }
    }
    if (error.message.includes("User has already voted")) {
      return { success: false, error: "You have already voted on this post.", code: "ALREADY_VOTED" }
    }
    return { success: false, error: `Voting failed: ${error.message}`, code: "VOTE_FAILED" }
  }

  if (data === false) {
    // If function returns false explicitly
    return { success: false, error: "Voting process failed.", code: "VOTE_PROCESS_FAILED" }
  }

  revalidatePath("/community") // Revalidate to show updated vote count and coin balances
  return { success: true, message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.` }
}

export async function fetchCommunityPosts(
  userId: string | undefined,
  categoryId?: number,
  sortOrder = "newest",
  page = 1,
  limit = 10,
) {
  const supabase = createServerSupabaseClient() // Use server client for server-side fetching
  const offset = (page - 1) * limit

  let query = supabase
    .from("community_posts")
    .select(`
      *,
      user:users!community_posts_user_id_fkey (id, username, full_name, avatar_url, tier),
      category:community_categories (id, name, slug),
      votes:community_post_votes (user_id)
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .range(offset, offset + limit - 1)

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  if (sortOrder === "newest") {
    query = query.order("created_at", { ascending: false })
  } else if (sortOrder === "oldest") {
    query = query.order("created_at", { ascending: true })
  } else if (sortOrder === "top") {
    query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
  }

  const { data, error, count } =
    await query.returns<Array<CommunityPost & { user: any; category: any; votes: Array<{ user_id: string }> }>>()

  if (error) {
    console.error("Error fetching posts:", error)
    return { posts: [], count: 0, error: error.message }
  }

  const postsWithVoteStatus = data.map((post) => ({
    ...post,
    user: post.user, // Supabase JS v2 might return nested objects directly
    category: post.category,
    has_voted: userId ? post.votes.some((vote) => vote.user_id === userId) : false,
  }))

  return { posts: postsWithVoteStatus, count: count || 0, error: null }
}

// Server action to fetch user suggestions for @mentions
export async function searchUsersForMention(query: string) {
  if (!query || query.length < 2) return []
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("users") // Assuming your public users table
    .select("id, username, full_name, avatar_url")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(5)

  if (error) {
    console.error("Error searching users:", error)
    return []
  }
  return data.map((u) => ({ id: u.username, display: u.username, full_name: u.full_name, avatar_url: u.avatar_url })) // Format for react-mentions
}
