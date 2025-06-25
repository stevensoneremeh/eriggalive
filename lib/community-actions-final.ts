"use server"

/**
 * Thin proxy: re-export the vetted async server actions so
 * legacy imports keep working without pulling `revalidatePath`
 * into the client bundle.
 */
export {
  createCommunityPostAction,
  voteOnPostAction,
  fetchCommunityPosts,
} from "./community-actions-final-fix"
