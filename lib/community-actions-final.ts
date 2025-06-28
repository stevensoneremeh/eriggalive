"use server"

// Re-export all functions from the main community actions file
export {
  createPost, // alias of createCommunityPostAction
  voteOnPost,
  bookmarkPost,
  createCommentAction,
  fetchCommentsForPost,
  createReportAction,
  toggleLikeCommentAction,
  deleteCommentAction,
  editCommentAction,
  searchUsersForMention,
} from "@/lib/community-actions"
