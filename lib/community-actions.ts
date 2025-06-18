"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type {
  User as PublicUser,
  CommunityPost,
  CommunityComment,
  ReportReason,
  ReportTargetType,
} from "@/types/database"
import DOMPurify from "isomorphic-dompurify"

const VOTE_COIN_AMOUNT = 100

async function getCurrentPublicUserProfile(
  supabaseClient: ReturnType<typeof createServerSupabaseClient>,
): Promise<PublicUser> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseClient.auth.getUser()
  if (authError || !authUser) {
    throw new Error("User not authenticated.")
  }

  const { data: userProfile, error: profileError } = await supabaseClient
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .single()

  if (profileError || !userProfile) {
    console.error("Public user profile not found for auth user:", authUser.id, profileError)
    throw new Error("User profile not found. Ensure user exists in public.users table.")
  }
  return userProfile
}

// --- Post Actions ---
export async function createCommunityPostAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  const rawContent = formData.get("content") as string
  const categoryId = formData.get("categoryId") as string
  const mediaFile = formData.get("mediaFile") as File | null

  if (!rawContent || !categoryId) {
    return { success: false, error: "Content and category are required." }
  }
  const sanitizedContent = DOMPurify.sanitize(rawContent)
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim() && !mediaFile) {
    return { success: false, error: "Post content cannot be empty without media." }
  }

  let media_url: string | undefined = undefined
  let media_type: string | undefined = undefined
  let media_metadata: Record<string, any> | undefined = undefined

  if (mediaFile && mediaFile.size > 0) {
    const fileExt = mediaFile.name.split(".").pop()
    const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
    const filePath = `community_media/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("eriggalive-assets")
      .upload(filePath, mediaFile)

    if (uploadError) return { success: false, error: `Media upload failed: ${uploadError.message}` }

    const { data: publicUrlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)
    media_url = publicUrlData.publicUrl

    if (mediaFile.type.startsWith("image/")) media_type = "image"
    else if (mediaFile.type.startsWith("audio/")) media_type = "audio"
    else if (mediaFile.type.startsWith("video/")) media_type = "video"
    media_metadata = { name: mediaFile.name, size: mediaFile.size, type: mediaFile.type }
  }

  const postData = {
    user_id: userProfile.id, // Correct: public.users.id (BIGINT)
    category_id: Number.parseInt(categoryId),
    content: sanitizedContent,
    media_url,
    media_type,
    media_metadata,
  }

  const { data: newPost, error } = await supabase.from("community_posts").insert(postData).select().single()

  if (error) return { success: false, error: error.message }
  revalidatePath("/community")
  return { success: true, post: newPost }
}

export async function editPostAction(postId: number, formData: FormData) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }
  const rawContent = formData.get("content") as string // HTML

  if (!rawContent) return { success: false, error: "Content cannot be empty." }
  const sanitizedContent = DOMPurify.sanitize(rawContent)
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim()) {
    return { success: false, error: "Post content cannot be empty." }
  }

  const { data: existingPost, error: fetchError } = await supabase
    .from("community_posts")
    .select("user_id")
    .eq("id", postId)
    .single()

  if (fetchError || !existingPost) return { success: false, error: "Post not found." }
  if (existingPost.user_id !== userProfile.id) return { success: false, error: "Not authorized to edit this post." }

  const { data, error } = await supabase
    .from("community_posts")
    .update({ content: sanitizedContent, is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", userProfile.id) // Ensure user owns the post
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  revalidatePath(`/community/post/${postId}`) // If there's a single post page
  return { success: true, post: data }
}

export async function deletePostAction(postId: number) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  const { error } = await supabase
    .from("community_posts")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", userProfile.id) // Ensure user owns the post

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  return { success: true }
}

export async function voteOnPostAction(postId: number, postCreatorAuthId: string) {
  // Renamed for clarity
  const supabase = createServerSupabaseClient()
  let voterProfile: PublicUser
  try {
    voterProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  // Fetch post creator's public.users.id to prevent self-vote using internal ID
  const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()
  if (postData && postData.user_id === voterProfile.id) {
    return { success: false, error: "You cannot vote on your own post.", code: "SELF_VOTE" }
  }

  const { data, error } = await supabase.rpc("handle_post_vote", {
    p_post_id: postId,
    p_voter_id: voterProfile.auth_user_id, // Pass auth_user_id (string) to RPC, assuming RPC handles lookup
    p_post_creator_id: postCreatorAuthId, // Pass auth_user_id (string)
    p_coin_amount: VOTE_COIN_AMOUNT,
  })

  if (error) {
    if (error.message.includes("Insufficient coins"))
      return { success: false, error: "Not enough Erigga Coins to vote.", code: "INSUFFICIENT_FUNDS" }
    if (error.message.includes("User has already voted"))
      return { success: false, error: "You have already voted on this post.", code: "ALREADY_VOTED" }
    return { success: false, error: `Voting failed: ${error.message}`, code: "VOTE_FAILED" }
  }
  if (data === false) return { success: false, error: "Voting process failed.", code: "VOTE_PROCESS_FAILED" }

  revalidatePath("/community")
  return { success: true, message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.` }
}

// --- Comment Actions ---
export async function createCommentAction(postId: number, content: string, parentCommentId?: number | null) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  if (!content.trim()) return { success: false, error: "Comment cannot be empty." }
  const sanitizedContent = DOMPurify.sanitize(content)
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim()) {
    return { success: false, error: "Comment content cannot be empty." }
  }

  const { data: newComment, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      user_id: userProfile.id,
      content: sanitizedContent,
      parent_comment_id: parentCommentId || null,
    })
    .select(
      `*, user:users!inner!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier)`,
    ) // Explicit FK name
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  revalidatePath(`/community/post/${postId}`)
  return { success: true, comment: newComment }
}

export async function editCommentAction(commentId: number, content: string) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }
  if (!content.trim()) return { success: false, error: "Comment cannot be empty." }
  const sanitizedContent = DOMPurify.sanitize(content)
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim()) {
    return { success: false, error: "Comment content cannot be empty." }
  }

  const { data, error } = await supabase
    .from("community_comments")
    .update({ content: sanitizedContent, is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", userProfile.id)
    .select(
      `*, user:users!inner!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier)`,
    ) // Explicit FK name
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  return { success: true, comment: data }
}

export async function deleteCommentAction(commentId: number) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  const { error } = await supabase
    .from("community_comments")
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), content: "[deleted]" })
    .eq("id", commentId)
    .eq("user_id", userProfile.id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  return { success: true }
}

export async function toggleLikeCommentAction(commentId: number) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  const { data: existingLike, error: fetchError } = await supabase
    .from("community_comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", userProfile.id)
    .maybeSingle()

  if (fetchError && fetchError.code !== "PGRST116") {
    return { success: false, error: fetchError.message, liked: false }
  }

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("community_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userProfile.id)
    if (deleteError) return { success: false, error: deleteError.message, liked: true }
    revalidatePath("/community")
    return { success: true, liked: false }
  } else {
    const { error: insertError } = await supabase
      .from("community_comment_likes")
      .insert({ comment_id: commentId, user_id: userProfile.id })
    if (insertError) return { success: false, error: insertError.message, liked: false }
    revalidatePath("/community")
    return { success: true, liked: true }
  }
}

// --- Report Action ---
export async function createReportAction(
  targetId: number,
  targetType: ReportTargetType,
  reason: ReportReason,
  notes?: string,
) {
  const supabase = createServerSupabaseClient()
  let userProfile: PublicUser
  try {
    userProfile = await getCurrentPublicUserProfile(supabase)
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  const { error } = await supabase.from("community_reports").insert({
    reporter_user_id: userProfile.id,
    target_id: targetId,
    target_type: targetType,
    reason: reason,
    additional_notes: notes,
  })

  if (error) return { success: false, error: error.message }
  return { success: true, message: "Report submitted successfully." }
}

// --- Fetching Actions (with search) ---
export async function fetchCommunityPosts(
  loggedInUserInternalId: number | undefined,
  options: {
    categoryId?: number
    sortOrder?: string
    page?: number
    limit?: number
    searchQuery?: string
  },
) {
  const { categoryId, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options
  const supabase = createServerSupabaseClient()
  const offset = (page - 1) * limit

  // IMPORTANT: Replace 'community_posts_user_id_fkey' and 'community_posts_category_id_fkey'
  // with the ACTUAL names of your foreign key constraints if they are different.
  const userJoinHint =
    "user:users!inner!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier)"
  const categoryJoinHint = "category:community_categories!inner!community_posts_category_id_fkey(id, name, slug)"

  let query = supabase
    .from("community_posts")
    .select(`
      *,
      ${userJoinHint},
      ${categoryJoinHint},
      votes:community_post_votes(user_id)
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)

  if (categoryId) query = query.eq("category_id", categoryId)
  if (searchQuery) query = query.ilike("content", `%${searchQuery}%`)

  if (sortOrder === "newest") query = query.order("created_at", { ascending: false })
  else if (sortOrder === "oldest") query = query.order("created_at", { ascending: true })
  else if (sortOrder === "top")
    query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } =
    await query.returns<Array<CommunityPost & { user: any; category: any; votes: Array<{ user_id: number }> }>>()

  if (error) {
    console.error("Error fetching posts:", error.message) // Log the actual error message
    return { posts: [], count: 0, error: error.message }
  }

  const postsWithVoteStatus = data.map((post) => ({
    ...post,
    user: post.user,
    category: post.category,
    has_voted: loggedInUserInternalId ? post.votes.some((vote) => vote.user_id === loggedInUserInternalId) : false,
  }))

  return { posts: postsWithVoteStatus, count: count || data.length, error: null }
}

export async function fetchCommentsForPost(postId: number, loggedInUserInternalId?: number) {
  const supabase = createServerSupabaseClient()

  // IMPORTANT: Replace 'community_comments_user_id_fkey' with the ACTUAL name
  const userCommentJoinHint =
    "user:users!inner!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier)"

  const { data, error } = await supabase
    .from("community_comments")
    .select(`
      *,
      ${userCommentJoinHint},
      likes:community_comment_likes(user_id)
    `)
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .is("parent_comment_id", null)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error.message)
    return []
  }

  const commentsWithReplies = await Promise.all(
    data.map(async (comment) => {
      const { data: repliesData, error: repliesError } = await supabase
        .from("community_comments")
        .select(`
          *,
          ${userCommentJoinHint},
          likes:community_comment_likes(user_id)
        `)
        .eq("post_id", postId)
        .eq("parent_comment_id", comment.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      return {
        ...comment,
        user: comment.user,
        has_liked: loggedInUserInternalId
          ? comment.likes.some((like: { user_id: number }) => like.user_id === loggedInUserInternalId)
          : false,
        replies: repliesError
          ? []
          : repliesData.map((r) => ({
              ...r,
              user: r.user,
              has_liked: loggedInUserInternalId
                ? r.likes.some((like: { user_id: number }) => like.user_id === loggedInUserInternalId)
                : false,
            })),
      }
    }),
  )
  return commentsWithReplies as CommunityComment[]
}

export async function searchUsersForMention(query: string) {
  if (!query || query.length < 2) return []
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(5)

  if (error) {
    console.error("Error searching users:", error)
    return []
  }
  return data.map((u) => ({ id: u.id, label: u.username, name: u.full_name, avatar: u.avatar_url }))
}
