"use server"

import { revalidatePath } from "next/cache"
import { createCommunityPostAction } from "./community-actions-final-fix"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getOrCreateUserProfile } from "@/lib/auth-sync"

/**
 * Wrapper expected elsewhere in the codebase.
 * Simply forwards to the real implementation living in
 * `community-actions-final-fix.ts` (already server-only).
 */
export async function createPost(formData: FormData) {
  return createCommunityPostAction(formData)
}

/**
 * Up-vote a post and invalidate the list.
 */
export async function voteOnPost(postId: number, postCreatorAuthId: string) {
  const { success, error } = await import("./community-actions-final-fix").then((mod) =>
    mod.voteOnPostAction(postId, postCreatorAuthId),
  )

  if (success) {
    revalidatePath("/community")
  }
  return { success, error }
}

/**
 * Simple bookmark helper so the build finds the named export.
 */
export async function bookmarkPost(postId: number) {
  const supabase = createServerSupabaseClient()
  const userProfile = await getOrCreateUserProfile()

  const { error } = await supabase
    .from("community_post_bookmarks")
    .insert({ user_id: userProfile.id, post_id: postId })
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate the bookmarks view if you have one
  revalidatePath("/community/bookmarks")
  return { success: true }
}
