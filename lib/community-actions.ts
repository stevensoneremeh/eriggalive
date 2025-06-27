"use server"

import { revalidatePath } from "next/cache"
import DOMPurify from "isomorphic-dompurify"
import { getOrCreateUserProfile } from "@/lib/auth-sync" // Assuming this correctly gets/creates user profile with auth_user_id and internal id
import { createServerSupabaseClient } from "@/lib/supabase/server" // Assuming this is the correct server client
import type { CommunityPost } from "@/types/database" // Assuming your types are correctly defined

const VOTE_COIN_AMOUNT = 100 // Define constants internally or pass as args if they vary

export interface CreatePostPayload {
  content: string
  categoryId: string
  mediaFile?: File
}

export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    if (!userProfile || !userProfile.id || !userProfile.auth_user_id) {
      return { success: false, error: "User profile not found or incomplete." }
    }

    const rawContent = formData.get("content") as string | null
    const categoryId = formData.get("categoryId") as string | null
    const mediaFile = formData.get("mediaFile") as File | null

    if (!rawContent?.trim() && !mediaFile) {
      return { success: false, error: "Please provide content or upload media." }
    }
    if (!categoryId) {
      return { success: false, error: "Please select a category." }
    }

    const sanitizedContent = rawContent ? DOMPurify.sanitize(rawContent) : ""

    let media_url: string | undefined = undefined
    let media_type: string | undefined = undefined
    let media_metadata: Record<string, any> | undefined = undefined

    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()?.toLowerCase()
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
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
      else media_type = "file" // Fallback

      media_metadata = {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type,
        original_extension: fileExt,
      }
    }

    const postData = {
      user_id: userProfile.id, // Internal DB user ID
      category_id: Number.parseInt(categoryId),
      content: sanitizedContent,
      media_url,
      media_type,
      media_metadata,
      is_published: true,
      is_deleted: false,
      is_edited: false,
      vote_count: 0,
      comment_count: 0,
      // tags: [], // Ensure your DB schema handles these if needed
      // mentions: null,
    }

    const { data: newPost, error } = await supabase
      .from("community_posts")
      .insert(postData)
      .select(
        `
          *,
          user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `,
      )
      .single()

    if (error) {
      console.error("Post creation error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    revalidatePath(`/community/category/${newPost.category?.slug}`) // Revalidate specific category if you have such pages
    return { success: true, post: newPost }
  } catch (error: any) {
    console.error("Create post action error:", error)
    return { success: false, error: error.message || "Failed to create post" }
  }
}

export async function voteOnPostAction(postId: number, postCreatorAuthId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const voterProfile = await getOrCreateUserProfile()

    if (!voterProfile || !voterProfile.id || !voterProfile.auth_user_id) {
      return { success: false, error: "User profile not found for voting." }
    }

    // Fetch post to check owner, ensure post_creator_auth_id is from the post's actual author
    const { data: postOwnerData, error: postOwnerError } = await supabase
      .from("community_posts")
      .select("user_id, users!inner(auth_user_id)")
      .eq("id", postId)
      .single()

    if (postOwnerError || !postOwnerData) {
      return { success: false, error: "Post not found or owner details missing." }
    }

    // @ts-ignore
    const actualPostCreatorAuthId = postOwnerData.users.auth_user_id

    if (postOwnerData.user_id === voterProfile.id) {
      return { success: false, error: "You cannot vote on your own post.", code: "SELF_VOTE" }
    }
    if (voterProfile.coins < VOTE_COIN_AMOUNT) {
      return { success: false, error: "Not enough Erigga Coins to vote.", code: "INSUFFICIENT_FUNDS" }
    }

    const { data, error: rpcError } = await supabase.rpc("handle_post_vote", {
      p_post_id: postId,
      p_voter_auth_id: voterProfile.auth_user_id, // Pass voter's Supabase Auth UID
      p_post_creator_auth_id: actualPostCreatorAuthId, // Pass post creator's Supabase Auth UID
      p_coin_amount: VOTE_COIN_AMOUNT,
    })

    if (rpcError) {
      console.error("Vote RPC error:", rpcError)
      return { success: false, error: `Voting failed: ${rpcError.message}`, code: "VOTE_FAILED" }
    }

    revalidatePath("/community") // Revalidate the main feed
    // Potentially revalidate user profiles if coin balances are shown there
    revalidatePath(`/profile/${voterProfile.username}`)
    // @ts-ignore
    const postCreatorProfile = await supabase
      .from("users")
      .select("username")
      .eq("auth_user_id", actualPostCreatorAuthId)
      .single()
    if (postCreatorProfile.data) {
      revalidatePath(`/profile/${postCreatorProfile.data.username}`)
    }

    return { success: true, voted: data, message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.` }
  } catch (error: any) {
    console.error("Vote action error:", error)
    return { success: false, error: error.message || "Failed to vote" }
  }
}

export async function fetchCommunityPosts(
  loggedInAuthUserId?: string | null, // Supabase Auth UID
  options: {
    categoryFilter?: number
    sortOrder?: "newest" | "oldest" | "top"
    page?: number
    limit?: number
    searchQuery?: string
  } = {},
) {
  try {
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options
    const supabase = createServerSupabaseClient()
    const offset = (page - 1) * limit

    let loggedInUserInternalId: number | undefined
    if (loggedInAuthUserId) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", loggedInAuthUserId)
        .single()
      loggedInUserInternalId = userData?.id
    }

    let query = supabase
      .from("community_posts")
      .select(
        `
          id, content, created_at, vote_count, comment_count, view_count, media_url, media_type, media_metadata,
          user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug),
          votes:community_post_votes(user_id)
        `,
      )
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (categoryFilter) query = query.eq("category_id", categoryFilter)
    if (searchQuery) query = query.ilike("content", `%${searchQuery}%`) // Ensure 'content' is indexed for performance

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

    const { data, error, count } = await query.returns<CommunityPost[]>() // Specify return type

    if (error) {
      console.error("Error fetching posts:", error)
      return { posts: [], totalCount: 0, error: error.message }
    }

    const postsWithVoteStatus = (data || []).map((post: any) => ({
      ...post,
      user: post.user || { username: "Unknown", avatar_url: null, tier: "grassroot", auth_user_id: "unknown" }, // Add auth_user_id to fallback
      category: post.category || { name: "General", slug: "general" },
      has_voted: loggedInUserInternalId
        ? post.votes.some((vote: any) => vote.user_id === loggedInUserInternalId)
        : false,
    }))

    // For total count, we need a separate query without range, or use PostgREST count header if available and configured
    // This is a simplified count for the current page, not total. For true pagination, a total count is needed.
    // const { count: totalCount } = await supabase.from("community_posts").select('*', { count: 'exact', head: true }) ... apply filters ...

    return { posts: postsWithVoteStatus, totalCount: count ?? data?.length ?? 0, error: null }
  } catch (error: any) {
    console.error("Fetch posts error:", error)
    return { posts: [], totalCount: 0, error: error.message || "Failed to fetch posts" }
  }
}
