"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserTierBadge } from "@/components/user-tier-badge"
import { RichTextEditor } from "./rich-text-editor" // For displaying and editing
import { CreateCommentForm } from "./create-comment-form"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, MessageSquare, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react"
import type { CommunityComment } from "@/types/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { toggleLikeCommentAction, deleteCommentAction, editCommentAction } from "@/lib/community-actions"
import DOMPurify from "dompurify"

interface CommentCardProps {
  comment: CommunityComment
  postId: number
  currentUserId?: string
  onCommentDeleted: (commentId: number, parentId?: number | null) => void
  onCommentUpdated: (updatedComment: CommunityComment) => void
  onReplyCreated: (newReply: CommunityComment) => void
}

export function CommentCard({
  comment,
  postId,
  currentUserId,
  onCommentDeleted,
  onCommentUpdated,
  onReplyCreated,
}: CommentCardProps) {
  const { user: authUser, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [isLiking, startLikeTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [showReplyForm, setShowReplyForm] = useState(false)

  const [optimisticLikeCount, setOptimisticLikeCount] = useState(comment.like_count)
  const [optimisticHasLiked, setOptimisticHasLiked] = useState(comment.has_liked || false)

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please login to like comments.", variant: "destructive" })
      return
    }
    startLikeTransition(async () => {
      const originalLikeCount = optimisticLikeCount
      const originalHasLiked = optimisticHasLiked
      setOptimisticLikeCount(originalHasLiked ? originalLikeCount - 1 : originalLikeCount + 1)
      setOptimisticHasLiked(!originalHasLiked)

      const result = await toggleLikeCommentAction(comment.id)
      if (!result.success) {
        setOptimisticLikeCount(originalLikeCount) // Revert on error
        setOptimisticHasLiked(originalHasLiked)
        toast({ title: "Error", description: result.error || "Failed to update like.", variant: "destructive" })
      } else {
        // Update with server confirmed state if needed, though optimistic should be fine
        // setOptimisticLikeCount(result.liked ? originalLikeCount + 1 : originalLikeCount -1); // This depends on what the action returns
        // setOptimisticHasLiked(result.liked);
        toast({ title: result.liked ? "Comment Liked" : "Like Removed" })
      }
    })
  }

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this comment?")) return
    startDeleteTransition(async () => {
      const result = await deleteCommentAction(comment.id)
      if (result.success) {
        onCommentDeleted(comment.id, comment.parent_comment_id)
        toast({ title: "Comment Deleted" })
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete comment.", variant: "destructive" })
      }
    })
  }

  const handleEditSubmit = async () => {
    if (!editedContent.replace(/<[^>]*>?/gm, "").trim()) {
      toast({ title: "Empty Comment", description: "Comment cannot be empty.", variant: "destructive" })
      return
    }
    const result = await editCommentAction(comment.id, editedContent)
    if (result.success && result.comment) {
      onCommentUpdated(result.comment as CommunityComment)
      setIsEditing(false)
      toast({ title: "Comment Updated" })
    } else {
      toast({ title: "Error", description: result.error || "Failed to update comment.", variant: "destructive" })
    }
  }

  const renderSanitizedHTML = (html: string) => {
    if (typeof window === "undefined") return { __html: html } // Basic SSR, assumes pre-sanitized or trusts source
    return { __html: DOMPurify.sanitize(html) }
  }

  if (comment.is_deleted) {
    return <div className="flex items-center space-x-3 py-3 text-sm text-muted-foreground italic">Comment deleted.</div>
  }

  return (
    <div className="flex items-start space-x-2 sm:space-x-3 py-3">
      <Link href={`/profile/${comment.user?.username || comment.user_id}`}>
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
          <AvatarImage src={comment.user?.avatar_url || "/placeholder-user.jpg"} alt={comment.user?.username} />
          <AvatarFallback>{comment.user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${comment.user?.username || comment.user_id}`} className="hover:underline">
                <span className="font-semibold text-sm">{comment.user?.full_name || comment.user?.username}</span>
              </Link>
              {comment.user?.tier && <UserTierBadge tier={comment.user.tier} size="xxs" />}
            </div>
            {authUser?.id === comment.user_id && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setIsEditing(true)
                      setEditedContent(comment.content)
                    }}
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                    )}{" "}
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2 my-2">
              <RichTextEditor content={editedContent} onChange={setEditedContent} placeholder="Edit comment..." />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleEditSubmit}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={renderSanitizedHTML(comment.content)}
            />
          )}
        </div>
        <div className="flex items-center space-x-3 mt-1.5 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleToggleLike}
            disabled={isLiking || !isAuthenticated}
            className={optimisticHasLiked ? "text-primary hover:text-primary" : "hover:text-primary"}
          >
            {isLiking ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ThumbsUp className="mr-1 h-3 w-3" />}
            {optimisticLikeCount} Like{optimisticLikeCount !== 1 && "s"}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowReplyForm(!showReplyForm)}
            disabled={!isAuthenticated}
          >
            <MessageSquare className="mr-1 h-3 w-3" /> Reply
          </Button>
          <span>{timeAgo}</span>
          {comment.is_edited && !isEditing && <span>(edited)</span>}
        </div>

        {showReplyForm && (
          <div className="ml-4 mt-2 border-l-2 pl-3">
            <CreateCommentForm
              postId={postId}
              parentId={comment.id}
              onCommentCreated={(newReply) => {
                onReplyCreated(newReply)
                setShowReplyForm(false)
              }}
              placeholder={`Replying to ${comment.user?.username || "user"}...`}
              autoFocus
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
