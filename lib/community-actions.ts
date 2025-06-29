"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "./supabase/server-client"

/* ---------- POST CRUD & VOTING ---------- */

export async function createCommunityPostAction({
  userId,
  content,
  mediaUrl,
}: {
  userId: string
  content: string
  mediaUrl?: string
}) {
  const { error, data } = await supabase
    .from("community_posts")
    .insert({ user_id: userId, content, media_url: mediaUrl })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/community")
  return data
}

export async function voteOnPostAction({
  userId,
  postId,
  value,
}: {
  userId: string
  postId: string
  value: 1 | -1
}) {
  const { error, data } = await supabase
    .from("community_post_votes")
    .upsert({ user_id: userId, post_id: postId, value })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/community")
  return data
}

/* Alias expected by older code */
export const voteOnPost = voteOnPostAction

export async function bookmarkPost({ userId, postId }: { userId: string; postId: string }) {
  const { error, data } = await supabase
    .from("community_bookmarks")
    .upsert({ user_id: userId, post_id: postId })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/community")
  return data
}

/* ---------- COMMENT HELPERS ---------- */

export async function fetchCommentsForPost(postId: string) {
  const { data, error } = await supabase
    .from("community_comments_with_users") // view incl. user display fields
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createCommentAction({
  userId,
  postId,
  content,
}: {
  userId: string
  postId: string
  content: string
}) {
  const { error, data } = await supabase
    .from("community_comments")
    .insert({ user_id: userId, post_id: postId, content })
    .select()
    .single()
  if (error) throw error
  revalidatePath(`/community/post/${postId}`)
  return data
}

export async function editCommentAction({
  commentId,
  content,
}: {
  commentId: string
  content: string
}) {
  const { error, data } = await supabase
    .from("community_comments")
    .update({ content })
    .eq("id", commentId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCommentAction(commentId: string) {
  const { error } = await supabase.from("community_comments").delete().eq("id", commentId)
  if (error) throw error
  return { success: true }
}

export async function toggleLikeCommentAction({
  userId,
  commentId,
}: {
  userId: string
  commentId: string
}) {
  // Supabase upsert toggle: if exists delete else insert
  const { count } = await supabase
    .from("community_comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("comment_id", commentId)

  if ((count ?? 0) > 0) {
    await supabase.from("community_comment_likes").delete().eq("user_id", userId).eq("comment_id", commentId)
    return { liked: false }
  }
  await supabase.from("community_comment_likes").insert({ user_id: userId, comment_id: commentId })
  return { liked: true }
}

/* ---------- REPORT & MENTION HELPERS ---------- */

export async function createReportAction({
  userId,
  targetId,
  reason,
}: {
  userId: string
  targetId: string
  reason: string
}) {
  const { error } = await supabase.from("community_reports").insert({
    reporter_id: userId,
    target_id: targetId,
    reason,
  })
  if (error) throw error
  return { success: true }
}

export async function searchUsersForMention(query: string) {
  const { data, error } = await supabase
    .from("users_public_profile") // view exposing public fields only
    .select("id, username, avatar_url")
    .ilike("username", `%${query}%`)
    .limit(8)
  if (error) throw error
  return data ?? []
}

/* Back-compat named export expected by some pages */
export const createPost = createCommunityPostAction
