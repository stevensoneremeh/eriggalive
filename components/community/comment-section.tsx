
"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Heart, Reply, Send, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createCommentAction, fetchCommentsForPost } from "@/lib/community-actions"

interface CommentSectionProps {
  postId: number
  currentUserId?: string
}

interface Comment {
  id: number
  content: string
  created_at: string
  like_count: number
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  replies?: Comment[]
  has_liked?: boolean
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadComments()
  }, [postId, currentUserId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const fetchedComments = await fetchCommentsForPost(postId, currentUserId)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error loading comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (content: string, parentId?: number) => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please write something before submitting.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await createCommentAction(postId, content, parentId)
      
      if (result.success) {
        toast({
          title: "Comment Posted",
          description: "Your comment has been added.",
        })
        
        // Reset forms
        if (parentId) {
          setReplyContent("")
          setReplyingTo(null)
        } else {
          setNewComment("")
        }
        
        // Reload comments to get the new one
        await loadComments()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to post comment.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <Card className={`${isReply ? "ml-8 mt-2" : "mb-4"}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={comment.user?.avatar_url || "/placeholder-user.jpg"} 
              alt={comment.user?.username} 
            />
            <AvatarFallback>
              {comment.user?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-sm">
                {comment.user?.full_name || comment.user?.username}
              </span>
              <Badge variant="secondary" className="text-xs">
                {comment.user?.tier || "grassroot"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at))} ago
              </span>
            </div>
            
            <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 px-2"
              >
                <Heart className="mr-1 h-3 w-3" />
                {comment.like_count || 0}
              </Button>
              
              {!isReply && currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-muted-foreground hover:text-foreground h-8 px-2"
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
            </div>
            
            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitComment(replyContent, comment.id)}
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="mr-1 h-3 w-3" />
                    )}
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      {currentUserId && (
        <div className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={() => handleSubmitComment(newComment)}
            disabled={submitting || !newComment.trim()}
            size="sm"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Comment
          </Button>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No comments yet. {currentUserId ? "Be the first to comment!" : "Sign in to add a comment."}
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentCard comment={comment} />
              {/* Render replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4">
                  {comment.replies.map((reply) => (
                    <CommentCard key={reply.id} comment={reply} isReply={true} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
