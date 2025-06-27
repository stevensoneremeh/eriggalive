"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { UserTierBadge } from "@/components/user-tier-badge"
import { formatDistanceToNow } from "date-fns"
import { Heart, Reply, MoreHorizontal, Send, Loader2, Flag, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Comment {
  id: number
  content: string
  created_at: string
  updated_at: string
  is_edited: boolean
  like_count: number
  reply_count: number
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  replies?: Comment[]
  has_liked?: boolean
  parent_comment_id?: number
}

interface CommentSectionProps {
  postId: number
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      const result = await response.json()

      if (result.success) {
        setComments(result.comments)
      }
    } catch (error) {
      console.error("Failed to load comments:", error)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmitComment = async (content: string, parentId?: number) => {
    if (!user || !content.trim()) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          parent_comment_id: parentId || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (parentId) {
          // Add reply to existing comment
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), result.comment],
                    reply_count: comment.reply_count + 1,
                  }
                : comment,
            ),
          )
          setReplyContent("")
          setReplyingTo(null)
        } else {
          // Add new top-level comment
          setComments((prev) => [result.comment, ...prev])
          setNewComment("")
        }

        toast({
          title: "Comment Posted! 💬",
          description: parentId ? "Your reply has been added." : "Your comment has been posted.",
        })
      } else {
        toast({
          title: "Comment Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Comment Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: number, isReply = false, parentId?: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to like comments.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/community/comments/${commentId}/like`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        if (isReply && parentId) {
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentId
                ? {
                    ...comment,
                    replies: comment.replies?.map((reply) =>
                      reply.id === commentId
                        ? {
                            ...reply,
                            has_liked: result.liked,
                            like_count: result.liked ? reply.like_count + 1 : reply.like_count - 1,
                          }
                        : reply,
                    ),
                  }
                : comment,
            ),
          )
        } else {
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    has_liked: result.liked,
                    like_count: result.liked ? comment.like_count + 1 : comment.like_count - 1,
                  }
                : comment,
            ),
          )
        }
      }
    } catch (error) {
      toast({
        title: "Like Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleDeleteComment = async (commentId: number, isReply = false, parentId?: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        if (isReply && parentId) {
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentId
                ? {
                    ...comment,
                    replies: comment.replies?.filter((reply) => reply.id !== commentId),
                    reply_count: Math.max(0, comment.reply_count - 1),
                  }
                : comment,
            ),
          )
        } else {
          setComments((prev) => prev.filter((comment) => comment.id !== commentId))
        }

        toast({
          title: "Comment Deleted",
          description: "Your comment has been deleted.",
        })
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const CommentCard = ({
    comment,
    isReply = false,
    parentId,
  }: { comment: Comment; isReply?: boolean; parentId?: number }) => (
    <div className={cn("flex space-x-3", isReply && "ml-8 pl-4 border-l-2 border-slate-200 dark:border-slate-700")}>
      <Link href={`/profile/${comment.user.username}`}>
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} alt={comment.user.username} />
          <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/profile/${comment.user.username}`} className="hover:underline">
              <span className="font-semibold text-sm">{comment.user.full_name || comment.user.username}</span>
            </Link>
            <span className="text-xs text-muted-foreground">@{comment.user.username}</span>
            <UserTierBadge tier={comment.user.tier} size="xs" />
            {comment.is_edited && (
              <Badge variant="outline" className="text-xs">
                edited
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed">{comment.content}</p>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>

          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 px-2 text-xs", comment.has_liked && "text-red-500")}
            onClick={() => handleLikeComment(comment.id, isReply, parentId)}
          >
            <Heart className={cn("h-3 w-3 mr-1", comment.has_liked && "fill-current")} />
            {comment.like_count}
          </Button>

          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user.id === comment.user.id ? (
                  <>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteComment(comment.id, isReply, parentId)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Flag className="mr-2 h-3 w-3" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-3 flex space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
              <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to @${comment.user.username}...`}
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmitComment(replyContent, comment.id)}
                  disabled={!replyContent.trim() || submitting}
                >
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentCard key={reply.id} comment={reply} isReply={true} parentId={comment.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3 animate-pulse">
            <div className="h-8 w-8 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-16 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      {/* New Comment Form */}
      {user ? (
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px]"
            />
            <div className="flex justify-end mt-2">
              <Button onClick={() => handleSubmitComment(newComment)} disabled={!newComment.trim() || submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p>Please log in to comment on this post.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
        )}
      </div>
    </div>
  )
}
