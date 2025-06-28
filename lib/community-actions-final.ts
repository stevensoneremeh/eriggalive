"use server"
import {
  createCommunityPostAction,
  voteOnPostAction,
  bookmarkPostAction,
  createReportAction,
} from "@/lib/community-actions"

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

// Legacy aliases for backward compatibility
export { createCommunityPostAction as createPost, voteOnPostAction as voteOnPost, bookmarkPostAction as bookmarkPost }

// Additional functions for completeness
export { createReportAction }
