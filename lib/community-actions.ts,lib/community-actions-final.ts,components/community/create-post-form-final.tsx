\`\`\`ts
/* lib/community-actions.ts */

/* ------------------------------------------------------------------ */
/*  Extra comment helpers required by the front-end build pipeline    */
/* ------------------------------------------------------------------ */

export { addComment as createCommentAction } // alias – keeps old imports working

// Edit an existing comment (only owner or moderator can do this)
export async function editCommentAction(commentId: number, content: string) {
  const supabase = createServerSupabaseClient()
  const userProfile = await getOrCreateUserProfile()
  if (!userProfile) return { success: false, error: "Auth required" }

  // attempt update – allow if owner or privileged role
  const { data: target } = await supabase.from("community_comments").select("user_id").eq("id", commentId).single()

  if (!target) return { success: false, error: "Comment not found" }

  const { data: profileRole } = await supabase.from("users").select("role").eq("id", userProfile.id).single()

  const canEdit =
    target.user_id === userProfile.id || ["admin", "super_admin", "moderator"].includes(profileRole?.role ?? "")

  if (!canEdit) return { success: false, error: "Permission denied" }

  const { error } = await supabase
    .from("community_comments")
    .update({ content, is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", commentId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  return { success: true }
}

// Soft-delete a comment (owner or moderator)
export async function deleteCommentAction(commentId: number) {
  const supabase = createServerSupabaseClient()
  const userProfile = await getOrCreateUserProfile()
  if (!userProfile) return { success: false, error: "Auth required" }

  const { data: target } = await supabase.from("community_comments").select("user_id").eq("id", commentId).single()

  if (!target) return { success: false, error: "Comment not found" }

  const { data: profileRole } = await supabase.from("users").select("role").eq("id", userProfile.id).single()

  const canDelete =
    target.user_id === userProfile.id || ["admin", "super_admin", "moderator"].includes(profileRole?.role ?? "")

  if (!canDelete) return { success: false, error: "Permission denied" }

  const { error } = await supabase
    .from("community_comments")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", commentId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  return { success: true }
}

// Simple report action (post or comment)
export async function createReportAction(entityType: "post" | "comment", entityId: number, reason: string) {
  const supabase = createServerSupabaseClient()
  const userProfile = await getOrCreateUserProfile()
  if (!userProfile) return { success: false, error: "Auth required" }

  const { error } = await supabase.from("community_reports").insert({
    reporter_id: userProfile.id,
    entity_type: entityType,
    entity_id: entityId,
    reason,
  })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export { searchUsersForMention } // already defined above but ensure named export
\`\`\`

\`\`\`ts
/* lib/community-actions-final.ts */

/* ------------------------------------------------------------------ */
/*  Back-compat wrappers for older imports                            */
/* ------------------------------------------------------------------ */

export { createCommunityPostAction as createPost }

export async function voteOnPost(postId: number) {
  // delegate to the newer implementation in community-actions.ts
  return handle_post_vote(postId)
}

// Minimal bookmark implementation – creates/removes a bookmark row
export async function bookmarkPost(postId: number) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { success: false, error: "Auth required" }

  // find internal profile
  const { data: profile } = await supabase.from("user_profiles").select("id").eq("auth_user_id", user.id).single()

  if (!profile) return { success: false, error: "Profile not found" }

  // has bookmark?
  const { data: existing } = await supabase
    .from("community_post_bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profile.id)
    .single()

  if (existing) {
    const { error } = await supabase.from("community_post_bookmarks").delete().eq("id", existing.id)
    if (error) return { success: false, error: error.message, action: "remove_failed" }
    return { success: true, action: "removed" }
  }

  const { error } = await supabase.from("community_post_bookmarks").insert({
    post_id: postId,
    user_id: profile.id,
  })
  if (error) return { success: false, error: error.message, action: "add_failed" }
  return { success: true, action: "added" }
}
\`\`\`

\`\`\`tsx
/* components/community/create-post-form-final.tsx */

// ⬇️ existing component export
export { CreatePostFormFinal as CreatePostForm }
\`\`\`
