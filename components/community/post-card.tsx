"use client"

import { useRef } from "react"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserTierBadge } from "@/components/user-tier-badge" // Assuming this exists
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, MoreHorizontal, Flag, Edit, Trash2, LinkIcon, Play, Pause } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { CommunityPost } from "@/types/database"
import { VoteButton } from "./vote-button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface PostCardProps {
  post: CommunityPost
  currentUserId?: string
}

// Basic media player, can be expanded
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
        <span className="text-sm text-muted-foreground">Audio track</span> {/* Placeholder for track info/progress */}
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

export function PostCard({ post, currentUserId }: PostCardProps) {
  const { user: authUser } = useAuth()
  const { toast } = useToast()
  const [optimisticVoteCount, setOptimisticVoteCount] = useState(post.vote_count)
  const [hasVotedOptimistic, setHasVotedOptimistic] = useState(post.has_voted || false)
  const [isVoting, startVoteTransition] = useTransition()

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  const handleReport = () => {
    // Placeholder for report functionality
    toast({ title: "Reported", description: "This post has been reported for review." })
  }

  const renderContentWithMentions = (text: string, mentionsData?: CommunityPost["mentions"]) => {
    if (!mentionsData || mentionsData.length === 0) {
      return <p className="whitespace-pre-wrap text-sm sm:text-base">{text}</p>
    }
    // This is a simplified display. react-mentions is primarily for input.
    // For display, you'd typically parse and replace.
    // A simple approach:
    let contentWithLinks = text
    mentionsData.forEach((mention) => {
      // This regex is basic, might need refinement for edge cases
      const mentionRegex = new RegExp(`@${mention.username}\\b`, "g")
      contentWithLinks = contentWithLinks.replace(
        mentionRegex,
        `<a href="/profile/${mention.username}" class="text-primary hover:underline font-medium">@${mention.username}</a>`,
      )
    })

    return (
      <p className="whitespace-pre-wrap text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: contentWithLinks }} />
    )
  }

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
                {timeAgo}{" "}
                {post.category && (
                  <>
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
                {authUser.id === post.user_id ? (
                  <>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" /> Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleReport}>
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
        {renderContentWithMentions(post.content, post.mentions)}

        {post.media_url && post.media_type && (
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
            initialVoteCount={optimisticVoteCount}
            initialHasVoted={hasVotedOptimistic}
            currentUserId={currentUserId}
            onVoteSuccess={(newVoteCount, newHasVoted) => {
              setOptimisticVoteCount(newVoteCount)
              setHasVotedOptimistic(newHasVoted)
            }}
          />
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
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
