"use server"

/**
 * Legacy proxy – keeps old import paths working.
 * Re-exports ONLY async functions from the canonical module.
 */
export {
  /* legacy names */
  createCommunityPostAction as createPost,
  voteOnPostAction as voteOnPost,
  bookmarkPost,
  /* full API */
  createCommunityPostAction,
  voteOnPostAction,
  bookmarkPost as bookmarkPostAction,
  fetchCommunityPosts,
} from "./community-actions-final-fix"
