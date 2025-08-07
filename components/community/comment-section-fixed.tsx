"use client"

import { useEffect, useState, useCallback } from "react"
import { CommentCard } from "./comment-card"
import { CreateCommentForm } from "./create-comment-form"
import type { CommunityComment } from "@/types/database"
import { fetchCommentsForPost } from "@/lib/community-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"

interface CommentSectionProps {
  postId: number
}

export function CommentSection({ postId }: CommentSectionProps) {
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
      console.error("Load comments error:", err)
      setError(err.message || "Failed to load comments.")
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [postId, currentUser?.id])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleCommentCreated = (newComment: CommunityComment) => {
    if (newComment.parent_comment_id) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === newComment.parent_comment_id
            ? { ...c, replies: [...(c.replies || []), newComment], reply_count: (c.reply_count || 0) + 1 }
            : c,
        ),
      )
    } else {
      setComments((prev) => [newComment, ...prev])
    }
  }

  const handleCommentDeleted = (commentId: number, parentId?: number | null) => {
    setComments((prev) => {
      if (parentId) {
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
        return prev.filter((c) => c.id !== commentId)
      }
    })
  }

  const handleCommentUpdated = (updatedComment: CommunityComment) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === updatedComment.id) {
          return { ...c, ...updatedComment, user: c.user, replies: c.replies, has_liked: c.has_liked }
        }
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
              onCommentDeleted={handleCommentDeleted}
              onCommentUpdated={handleCommentUpdated}
              onReplyCreated={handleCommentCreated}
            />
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-6 sm:ml-8 pl-3 sm:pl-4 border-l-2 space-y-3 mt-3">
                {comment.replies.map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    currentUserId={currentUser?.id}
                    onCommentDeleted={handleCommentDeleted}
                    onCommentUpdated={handleCommentUpdated}
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
