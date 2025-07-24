"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Send, Heart, Reply, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Comment {
  id: number
  content: string
  like_count: number
  reply_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  has_liked: boolean
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: number
  commentCount: number
  onCommentCountChange: (newCount: number) => void
}

export function CommentSection({ postId, commentCount, onCommentCountChange }: CommentSectionProps) {
  const { isAuthenticated, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments()
    }
  }, [showComments, postId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.comments || [])
      } else {
        console.error("Error loading comments:", data.error)
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment")
      return
    }

    if (!isAuthenticated) {
      toast.error("Please sign in to comment")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setNewComment("")
        setComments([result.comment, ...comments])
        onCommentCountChange(commentCount + 1)
        toast.success("Comment added!")
      } else {
        toast.error(result.error || "Failed to add comment")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like comments")
      return
    }

    try {
      const response = await fetch(`/api/community/comments/${commentId}/like`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        setComments(
          comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  like_count: result.liked ? comment.like_count + 1 : comment.like_count - 1,
                  has_liked: result.liked,
                }
              : comment,
          ),
        )
      } else {
        toast.error(result.error || "Failed to like comment")
      }
    } catch (error) {
      console.error("Error liking comment:", error)
      toast.error("Failed to like comment")
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-purple-500 text-white"
      case "pioneer":
        return "bg-blue-500 text-white"
      case "grassroot":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      default:
        return "Fan"
    }
  }

  return (
    <div className="space-y-4">
      {/* Comments Toggle */}
      <Button
        variant="ghost"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        <span>
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </span>
      </Button>

      {showComments && (
        <div className="space-y-4">
          {/* Add Comment Form */}
          {isAuthenticated && profile ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Sign in to join the conversation</p>
            </div>
          )}

          <Separator />

          {/* Comments List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.user.username}</span>
                        <Badge className={cn("text-xs", getTierColor(comment.user.tier))}>
                          {getTierDisplayName(comment.user.tier)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p>

                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeComment(comment.id)}
                          className={cn("flex items-center space-x-1 text-xs", comment.has_liked && "text-red-500")}
                        >
                          <Heart className={cn("h-3 w-3", comment.has_liked && "fill-current")} />
                          <span>{comment.like_count}</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-xs">
                          <Reply className="h-3 w-3" />
                          <span>Reply</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
