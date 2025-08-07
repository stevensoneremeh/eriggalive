"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserTierBadge } from "@/components/user-tier-badge"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, MoreHorizontal, Flag, Edit, Trash2, LinkIcon, Play, Pause } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { CommunityPost } from "@/types/database"
import { VoteButton } from "./vote-button-fixed"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import DOMPurify from "isomorphic-dompurify"
import { CommentSection } from "./comment-section-fixed"
import { RichTextEditor } from "./rich-text-editor"
import { deletePostAction, editPostAction } from "@/lib/community-actions"

interface PostCardProps {
  post: CommunityPost
  currentUserId?: string
  onPostDeleted: (postId: number) => void
  onPostUpdated: (updatedPost: CommunityPost) => void
}

function MediaPlayer({ url, type }: { url: string; type: "audio" | "video" }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (type === "audio" && audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play()
    } else if (type === "video" && videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  if (type === "audio") {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        <Button size="icon" variant="ghost" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="w-full hidden" />
        <span className="text-sm text-muted-foreground">Audio track</span>
      </div>
    )
  }

  if (type === "video") {
    return (
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full rounded-lg border max-h-[500px]"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    )
  }

  return null
}

export function PostCard({ post, currentUserId, onPostDeleted, onPostUpdated }: PostCardProps) {
  const { user: authUser } = useAuth()
  const { toast } = useToast()
  const [showComments, setShowComments] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(post.content)
  const [isDeleting, setIsDeleting] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  const renderRichContent = (htmlContent: string) => {
    if (typeof window === "undefined") return { __html: htmlContent }
    const cleanHtml = DOMPurify.sanitize(htmlContent, { USE_PROFILES: { html: true } })
    return { __html: cleanHtml }
  }

  const handleEditSubmit = async () => {
    if (!editedContent.replace(/<[^>]*>?/gm, "").trim()) {
      toast({
        title: "Empty Post",
        description: "Post content cannot be empty.",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("content", editedContent)

    try {
      const result = await editPostAction(post.id, formData)
      if (result.success && result.post) {
        onPostUpdated(result.post as CommunityPost)
        setIsEditing(false)
        toast({ title: "Post Updated" })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update post.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Edit error:", error)
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      const result = await deletePostAction(post.id)
      if (result.success) {
        onPostDeleted(post.id)
        toast({ title: "Post Deleted" })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete post.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (post.is_deleted) return null

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.user?.username || post.user_id}`}>
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11">
                <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} alt={post.user?.username} />
                <AvatarFallback>{post.user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${post.user?.username || post.user_id}`} className="hover:underline">
                  <span className="font-semibold text-sm sm:text-base">
                    {post.user?.full_name || post.user?.username}
                  </span>
                </Link>
                {post.user?.tier && <UserTierBadge tier={post.user.tier} size="xs" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {timeAgo}
                {post.is_edited && !isEditing && (
                  <span title={new Date(post.updated_at).toLocaleString()}> (edited)</span>
                )}
                {post.category && (
                  <>
                    {" "}
                    in{" "}
                    <Link href={`/community?category=${post.category.slug}`} className="hover:underline text-primary">
                      {post.category.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          {authUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {authUser.id === post.user?.auth_user_id ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setIsEditing(true)
                        setEditedContent(post.content)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem>
                    <Flag className="mr-2 h-4 w-4" /> Report Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`)}
                >
                  <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {isEditing ? (
          <div className="space-y-2">
            <RichTextEditor content={editedContent} onChange={setEditedContent} placeholder="Edit your post..." />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleEditSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={renderRichContent(post.content)} />
        )}

        {post.media_url && post.media_type && !isEditing && (
          <div className="mt-3 rounded-lg overflow-hidden border">
            {post.media_type === "image" && (
              <img
                src={post.media_url || "/placeholder.svg"}
                alt="Post media"
                className="w-full h-auto max-h-[600px] object-contain bg-muted"
              />
            )}
            {(post.media_type === "audio" || post.media_type === "video") && (
              <MediaPlayer url={post.media_url} type={post.media_type} />
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 flex items-center justify-between border-t bg-muted/30">
        <div className="flex items-center space-x-4">
          <VoteButton
            postId={post.id}
            postCreatorId={post.user_id}
            initialVoteCount={post.vote_count}
            initialHasVoted={post.has_voted || false}
            currentUserId={currentUserId}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="mr-1.5 h-4 w-4" />
            {post.comment_count || 0}
          </Button>
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>

      {showComments && (
        <div className="p-4 border-t">
          <CommentSection postId={post.id} />
        </div>
      )}
    </Card>
  )
}

export function PostCardSkeleton() {
  return (
    <Card className="shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-full bg-muted animate-pulse"></div>
          <div>
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-1.5"></div>
            <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-4/6 bg-muted rounded animate-pulse"></div>
        <div className="h-40 w-full bg-muted rounded-lg animate-pulse mt-3"></div>
      </CardContent>
      <CardFooter className="p-4 flex items-center justify-between border-t bg-muted/30">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
        </div>
      </CardFooter>
    </Card>
  )
}
