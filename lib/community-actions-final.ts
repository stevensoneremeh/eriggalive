"use server"

/**
 * Compatibility shim
 * -------------------
 * Older code still imports server actions from:
 *   "@/lib/community-actions-final"
 *
 * We migrated the real implementations to
 *   "@/lib/community-actions"
 *
 * To avoid changing all existing import statements, this
 * file simply re-exports the async functions from the new
 * module.  Because it starts with `"use server"`, everything
 * here is treated as server-only, so importing `revalidatePath`
 * (used inside the delegated functions) is perfectly valid.
 */

export {
  /* core post actions */
  createCommunityPostAction,
  fetchCommunityPosts,
  voteOnPostAction,
  /* convenience wrappers used elsewhere */
  createPost,
  voteOnPost,
  bookmarkPost,
} from "./community-actions"
