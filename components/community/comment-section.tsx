"use client"

import { useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { CommentCard } from "./comment-card"
import { CreateCommentForm } from "./create-comment-form"
import type { CommunityComment, Database } from "@/types/database"
import { fetchCommentsForPost } from "@/lib/community-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"

interface CommentSectionProps {
  postId: number
}

export function CommentSection({ postId }: CommentSectionProps) {
  const supabase = createClientComponentClient<Database>()
  const { user: currentUser } = useAuth()
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedComments = await fetchCommentsForPost(postId, currentUser?.id)
      setComments(fetchedComments)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load comments.")
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [postId, currentUser?.id])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // Realtime subscriptions for comments
  useEffect(() => {
    const commentChannel: RealtimeChannel = supabase
      .channel(`community_comments:${postId}`)
      .on<CommunityComment>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_comments", filter: `post_id=eq.${postId}` },
        async (payload) => {
          // Fetch the new comment with user data
          const { data: newCommentData, error: fetchError } = await supabase
            .from("community_comments")
            .select(
              `*, user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier), likes:community_comment_likes(user_id)`,
            )
            .eq("id", payload.new.id)
            .single()

          if (fetchError || !newCommentData) return

          const newCommentWithDetails = {
            ...newCommentData,
            user: newCommentData.user,
            has_liked: currentUser ? newCommentData.likes.some((l) => l.user_id === currentUser.id) : false,
            replies: [], // New comments won't have replies initially
          } as CommunityComment

          setComments((prevComments) => {
            if (newCommentWithDetails.parent_comment_id) {
              // It's a reply
              return prevComments.map((c) =>
                c.id === newCommentWithDetails.parent_comment_id
                  ? {
                      ...c,
                      replies: [...(c.replies || []), newCommentWithDetails],
                      reply_count: (c.reply_count || 0) + 1,
                    }
                  : c,
              )
            } else {
              // It's a top-level comment
              return [newCommentWithDetails, ...prevComments] // Add to top or bottom based on sort
            }
          })
        },
      )
      .on<CommunityComment>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "community_comments", filter: `post_id=eq.${postId}` },
        (payload) => {
          setComments((prev) =>
            prev
              .map((c) =>
                c.id === payload.new.id
                  ? { ...c, ...payload.new, user: c.user, replies: c.replies, has_liked: c.has_liked }
                  : c,
              )
              .map((pc) => {
                if (pc.replies && pc.replies.find((r) => r.id === payload.new.id)) {
                  return {
                    ...pc,
                    replies: pc.replies.map((r) =>
                      r.id === payload.new.id ? { ...r, ...payload.new, user: r.user, has_liked: r.has_liked } : r,
                    ),
                  }
                }
                return pc
              }),
          )
        },
      )
      .on<CommunityComment>(
        // For soft deletes (is_deleted = true)
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "community_comments", filter: `post_id=eq.${postId}` },
        (payload) => {
          if (payload.new.is_deleted) {
            handleCommentDeletedState(payload.new.id, payload.new.parent_comment_id)
          }
        },
      )
      // Realtime for comment likes (more complex, might need specific channel or careful filtering)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_comment_likes" }, // Broad, filter client-side
        (payload) => {
          const relevantCommentId = (payload.new as any)?.comment_id || (payload.old as any)?.comment_id
          if (!relevantCommentId) return

          setComments((prev) =>
            prev.map((c) => {
              let changed = false
              let newLikeCount = c.like_count
              let newHasLiked = c.has_liked

              const updateLikes = (comment: CommunityComment) => {
                if (comment.id === relevantCommentId) {
                  changed = true
                  if (payload.eventType === "INSERT" && (payload.new as any).user_id === currentUser?.id)
                    newHasLiked = true
                  if (payload.eventType === "DELETE" && (payload.old as any).user_id === currentUser?.id)
                    newHasLiked = false
                  // For like_count, ideally rely on DB trigger or re-fetch comment.
                  // This is a rough approximation for realtime UI update.
                  if (payload.eventType === "INSERT") newLikeCount = (comment.like_count || 0) + 1
                  if (payload.eventType === "DELETE") newLikeCount = Math.max(0, (comment.like_count || 0) - 1)
                  return { ...comment, like_count: newLikeCount, has_liked: newHasLiked }
                }
                return comment
              }

              const updatedComment = updateLikes(c)
              if (c.replies) {
                const updatedReplies = c.replies.map((r) => updateLikes(r))
                if (updatedReplies.some((r, i) => r !== c.replies![i])) {
                  // check if any reply changed
                  return { ...updatedComment, replies: updatedReplies }
                }
              }
              return updatedComment
            }),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentChannel)
    }
  }, [supabase, postId, currentUser?.id])

  const handleCommentCreated = (newComment: CommunityComment) => {
    // Optimistic update handled by Realtime, but this can be a fallback or for non-realtime
    // For replies, ensure they are nested correctly.
    if (newComment.parent_comment_id) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === newComment.parent_comment_id
            ? { ...c, replies: [...(c.replies || []), newComment], reply_count: (c.reply_count || 0) + 1 }
            : c,
        ),
      )
    } else {
      setComments((prev) => [newComment, ...prev]) // Add new top-level comments to the beginning
    }
  }

  const handleCommentDeletedState = (commentId: number, parentId?: number | null) => {
    setComments((prev) => {
      if (parentId) {
        // It's a reply
        return prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: c.replies?.filter((r) => r.id !== commentId),
                reply_count: Math.max(0, (c.reply_count || 0) - 1),
              }
            : c,
        )
      } else {
        // It's a top-level comment
        return prev.filter((c) => c.id !== commentId)
      }
    })
  }

  const handleCommentUpdatedState = (updatedComment: CommunityComment) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === updatedComment.id)
          return { ...c, ...updatedComment, user: c.user, replies: c.replies, has_liked: c.has_liked } // Preserve user/replies if not in payload
        if (c.replies) {
          const replyIndex = c.replies.findIndex((r) => r.id === updatedComment.id)
          if (replyIndex > -1) {
            const newReplies = [...c.replies]
            newReplies[replyIndex] = {
              ...newReplies[replyIndex],
              ...updatedComment,
              user: newReplies[replyIndex].user,
              has_liked: newReplies[replyIndex].has_liked,
            }
            return { ...c, replies: newReplies }
          }
        }
        return c
      }),
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-destructive text-sm py-4">Error loading comments: {error}</p>
  }

  return (
    <div className="py-4 space-y-3">
      <h3 className="text-lg font-semibold mb-2">
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>
      <CreateCommentForm postId={postId} onCommentCreated={handleCommentCreated} />
      <div className="space-y-3 divide-y divide-border">
        {comments.map((comment) => (
          <div key={comment.id} className="pt-3">
            <CommentCard
              comment={comment}
              postId={postId}
              currentUserId={currentUser?.id}
              onCommentDeleted={handleCommentDeletedState}
              onCommentUpdated={handleCommentUpdatedState}
              onReplyCreated={handleCommentCreated} // Replies are also new comments
            />
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-6 sm:ml-8 pl-3 sm:pl-4 border-l-2 space-y-3 mt-3">
                {comment.replies.map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    currentUserId={currentUser?.id}
                    onCommentDeleted={handleCommentDeletedState}
                    onCommentUpdated={handleCommentUpdatedState}
                    onReplyCreated={handleCommentCreated}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>}
      </div>
    </div>
  )
}
