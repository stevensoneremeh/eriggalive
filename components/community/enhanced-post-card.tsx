"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserTierBadge } from "@/components/user-tier-badge"
import { formatDistanceToNow } from "date-fns"
import {
  MessageSquare,
  MoreHorizontal,
  Flag,
  Edit,
  Trash2,
  LinkIcon,
  Play,
  Pause,
  ArrowBigUp,
  Coins,
  Share2,
  Bookmark,
  Eye,
  Hash,
  AtSign,
  Volume2,
  VolumeX,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { CommunityPost } from "@/types/database"
import { useAuth } from "@/contexts/auth-context"
import { useCommunity } from "@/contexts/community-context"
import { useToast } from "@/components/ui/use-toast"
import DOMPurify from "isomorphic-dompurify"
import { CommentSection } from "./comment-section"
import { ReportDialog } from "./report-dialog"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

interface EnhancedPostCardProps {
  post: CommunityPost
  currentUserId?: string
  onPostUpdate?: (updatedPost: CommunityPost) => void
  onPostDelete?: (postId: number) => void
  showFullContent?: boolean
  isPreview?: boolean
}

function MediaPlayer({ url, type, metadata }: { url: string; type: "audio" | "video"; metadata?: any }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
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

  const toggleMute = () => {
    if (type === "audio" && audioRef.current) {
      audioRef.current.muted = !isMuted
    } else if (type === "video" && videoRef.current) {
      videoRef.current.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (type === "audio") {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlay}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{metadata?.name || "Audio Track"}</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={toggleMute} className="h-8 w-8">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={url}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="hidden"
        />
      </div>
    )
  }

  if (type === "video") {
    return (
      <div className="relative rounded-xl overflow-hidden border">
        <video
          ref={videoRef}
          src={url}
          controls
          className="w-full rounded-xl max-h-[500px] object-contain bg-black"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          poster={metadata?.thumbnail || url.replace(/\.[^/.]+$/, "_thumb.jpg")}
        />
      </div>
    )
  }

  return null
}

function VoteButton({
  post,
  onVoteUpdate,
}: { post: CommunityPost; onVoteUpdate?: (newCount: number, hasVoted: boolean) => void }) {
  const { user, profile } = useAuth()
  const { voteOnPost } = useCommunity()
  const { toast } = useToast()
  const [isVoting, setIsVoting] = useState(false)
  const [localVoteCount, setLocalVoteCount] = useState(post.vote_count)
  const [localHasVoted, setLocalHasVoted] = useState(post.has_voted || false)

  const handleVote = useCallback(async () => {
    if (!user || !profile) {
      toast({
        title: "Login Required",
        description: "Please login to vote on posts.",
        variant: "destructive",
      })
      return
    }

    if (profile.coins < 100) {
      toast({
        title: "Insufficient Coins",
        description: "You need at least 100 Erigga Coins to vote.",
        variant: "destructive",
      })
      return
    }

    if (post.user_id === profile.id) {
      toast({
        title: "Cannot Vote",
        description: "You cannot vote on your own post.",
        variant: "destructive",
      })
      return
    }

    setIsVoting(true)

    // Optimistic update
    const newHasVoted = !localHasVoted
    const newVoteCount = newHasVoted ? localVoteCount + 1 : localVoteCount - 1
    setLocalHasVoted(newHasVoted)
    setLocalVoteCount(newVoteCount)
    onVoteUpdate?.(newVoteCount, newHasVoted)

    try {
      const result = await voteOnPost(post.id, post.user?.auth_user_id || "")
      if (result.success) {
        toast({
          title: newHasVoted ? "Vote Added! 🎉" : "Vote Removed",
          description: `100 Erigga Coins ${newHasVoted ? "transferred to" : "refunded from"} the post creator.`,
          duration: 3000,
        })
      } else {
        // Revert optimistic update on error
        setLocalHasVoted(!newHasVoted)
        setLocalVoteCount(localVoteCount)
        onVoteUpdate?.(localVoteCount, !newHasVoted)

        toast({
          title: "Vote Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setLocalHasVoted(!newHasVoted)
      setLocalVoteCount(localVoteCount)
      onVoteUpdate?.(localVoteCount, !newHasVoted)

      toast({
        title: "Vote Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }, [user, profile, post, voteOnPost, toast, localVoteCount, localHasVoted, onVoteUpdate])

  const isOwnPost = profile?.id === post.user_id

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-200",
              localHasVoted && "text-red-500 bg-red-50 dark:bg-red-900/20",
              isOwnPost && "opacity-50 cursor-not-allowed",
              isVoting && "animate-pulse",
            )}
            onClick={handleVote}
            disabled={isVoting || isOwnPost || !user}
          >
            <ArrowBigUp className={cn("h-5 w-5", localHasVoted && "fill-current")} />
            <span className="font-medium">{localVoteCount}</span>
            <Coins className="h-4 w-4 text-yellow-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOwnPost ? "Can't vote on own post" : `${localHasVoted ? "Remove vote" : "Vote"} (100 coins)`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function EnhancedPostCard({
  post,
  currentUserId,
  onPostUpdate,
  onPostDelete,
  showFullContent = false,
  isPreview = false,
}: EnhancedPostCardProps) {
  const { user, profile } = useAuth()
  const { bookmarkPost, sharePost } = useCommunity()
  const { toast } = useToast()
  const [showComments, setShowComments] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [viewCount, setViewCount] = useState(post.view_count || 0)
  const [hasViewed, setHasViewed] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  // Track post view
  useEffect(() => {
    if (!hasViewed && !isPreview) {
      const timer = setTimeout(() => {
        setHasViewed(true)
        setViewCount((prev) => prev + 1)
        // Here you would call an API to track the view
        // trackPostView(post.id)
      }, 2000) // Track view after 2 seconds

      return () => clearTimeout(timer)
    }
  }, [hasViewed, isPreview, post.id])

  const renderRichContent = (htmlContent: string) => {
    if (typeof window === "undefined") return { __html: htmlContent }
    const cleanHtml = DOMPurify.sanitize(htmlContent, { USE_PROFILES: { html: true } })
    return { __html: cleanHtml }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/community/post/${post.id}`
    await navigator.clipboard.writeText(url)
    toast({ title: "Link Copied!", description: "Post link copied to clipboard." })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.user?.username}`,
          text: post.content.substring(0, 100) + "...",
          url: `${window.location.origin}/community/post/${post.id}`,
        })
      } catch (error) {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const handleBookmark = async () => {
    try {
      const result = await bookmarkPost(post.id)
      if (result.success) {
        setIsBookmarked(!isBookmarked)
        toast({
          title: isBookmarked ? "Bookmark Removed" : "Post Bookmarked!",
          description: isBookmarked ? "Removed from your bookmarks" : "Added to your bookmarks",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to bookmark post",
        variant: "destructive",
      })
    }
  }

  const extractHashtags = (content: string) => {
    const hashtagRegex = /#[\w]+/g
    return content.match(hashtagRegex) || []
  }

  const extractMentions = (content: string) => {
    const mentionRegex = /@[\w]+/g
    return content.match(mentionRegex) || []
  }

  const hashtags = post.hashtags || extractHashtags(post.content)
  const mentions = extractMentions(post.content)

  if (post.is_deleted) return null

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/profile/${post.user?.username || post.user_id}`}>
              <Avatar className="h-12 w-12 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} alt={post.user?.username} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                  {post.user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${post.user?.username || post.user_id}`} className="hover:underline">
                  <span className="font-bold text-lg">{post.user?.full_name || post.user?.username}</span>
                </Link>
                <span className="text-muted-foreground">@{post.user?.username}</span>
                {post.user?.tier && <UserTierBadge tier={post.user.tier} size="sm" />}
                {post.user?.is_verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{timeAgo}</span>
                {post.is_edited && <span title={new Date(post.updated_at).toLocaleString()}>• edited</span>}
                {post.category && (
                  <>
                    <span>•</span>
                    <Link href={`/community?category=${post.category.slug}`} className="hover:underline text-primary">
                      {post.category.name}
                    </Link>
                  </>
                )}
                {post.is_featured && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    ⭐ Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user.id === post.user?.auth_user_id ? (
                  <>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" /> Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="mr-2 h-4 w-4" /> Report Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopyLink}>
                  <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBookmark}>
                  <Bookmark className={cn("mr-2 h-4 w-4", isBookmarked && "fill-current")} />
                  {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-4 space-y-4">
        <div
          className={cn("prose prose-sm max-w-none dark:prose-invert", !showFullContent && "line-clamp-6")}
          dangerouslySetInnerHTML={renderRichContent(post.content)}
        />

        {!showFullContent && post.content.length > 300 && (
          <Button variant="link" className="p-0 h-auto text-primary">
            Show more
          </Button>
        )}

        {/* Hashtags and Mentions */}
        {(hashtags.length > 0 || mentions.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {hashtags.slice(0, 5).map((hashtag, index) => (
              <Link key={index} href={`/community?hashtag=${hashtag.slice(1)}`}>
                <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                  <Hash className="h-3 w-3 mr-1" />
                  {hashtag.slice(1)}
                </Badge>
              </Link>
            ))}
            {mentions.slice(0, 3).map((mention, index) => (
              <Link key={index} href={`/profile/${mention.slice(1)}`}>
                <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                  <AtSign className="h-3 w-3 mr-1" />
                  {mention.slice(1)}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Media Display */}
        {post.media_url && post.media_type && (
          <div className="rounded-xl overflow-hidden">
            {post.media_type === "image" && (
              <img
                src={post.media_url || "/placeholder.svg"}
                alt="Post media"
                className="w-full h-auto max-h-[600px] object-contain bg-slate-50 dark:bg-slate-800 rounded-xl"
                loading="lazy"
              />
            )}
            {(post.media_type === "audio" || post.media_type === "video") && (
              <MediaPlayer url={post.media_url} type={post.media_type} metadata={post.media_metadata} />
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 py-4 flex items-center justify-between border-t bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-1">
          <VoteButton post={post} onVoteUpdate={onPostUpdate} />

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {post.comment_count || 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-muted-foreground hover:text-primary hover:bg-primary/10",
              isBookmarked && "text-primary bg-primary/10",
            )}
            onClick={handleBookmark}
          >
            <Bookmark className={cn("mr-2 h-4 w-4", isBookmarked && "fill-current")} />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{viewCount}</span>
          </div>
          {user && profile && (
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{profile.coins}</span>
            </div>
          )}
        </div>
      </CardFooter>

      {showComments && (
        <div className="border-t bg-white dark:bg-slate-800">
          <CommentSection postId={post.id} />
        </div>
      )}

      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetId={post.id}
        targetType="post"
        targetTitle={`Post by ${post.user?.username}`}
      />
    </Card>
  )
}

export function PostCardSkeleton() {
  return (
    <Card className="shadow-lg overflow-hidden border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
      <CardHeader className="p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4 space-y-3">
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse mt-4"></div>
      </CardContent>
      <CardFooter className="px-6 py-4 flex items-center justify-between border-t bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
      </CardFooter>
    </Card>
  )
}
