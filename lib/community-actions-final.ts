const VOTE_COIN_AMOUNT = 100

// ---------------------------------------------------------------------------
//  Legacy surface-area: forward to the canonical helpers in community-actions
// ---------------------------------------------------------------------------

import {
  createCommunityPostAction as createPost,
  voteOnPostAction       as voteOnPost,
} from "@/lib/community-actions"

// simple passthrough for bookmark support (kept from the original file)
export async function bookmarkPost(postId: number) {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server")
  const supabase = createServerSupabaseClient()

  // same logic the original implementation used
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Authentication required" }

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (!userData) return { success: false, error: "User profile not found" }

  const { data: existing } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userData.id)
    .eq("post_id", postId)
    .single()

  if (existing) {
    await supabase.from("user_bookmarks").delete().eq("id", existing.id)
    return { success: true, bookmarked: false }
  }

  await supabase.from("user_bookmarks").insert({
    user_id: userData.id,
    post_id: postId,
  })

  return { success: true, bookmarked: true }
}

// Re-export the aliases so existing imports continue to work
export { createPost, voteOnPost }
