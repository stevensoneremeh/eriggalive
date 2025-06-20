"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
  ArrowBigUp,
  Coins,
  Share2,
  Bookmark,
  Eye,
  Hash,
  Heart,
  Laugh,
  Angry,
  Frown,
  Flame,
  Zap,
  Flag,
  Edit,
  Trash2,
  Copy,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { CommentSection } from "./enhanced-comment-section"
import { FollowButton } from "./follow-button"

interface PostCardProps {
  post: any
  onPostUpdate?: (post: any) => void
  onPostDelete?: (postId: number) => void
}

const REACTIONS = [
  { type: "fire", icon: Flame, label: "Fire", color: "text-orange-500" },
  { type: "love", icon: Heart, label: "Love", color: "text-red-500" },
  { type: "laugh", icon: Laugh, label: "Laugh", color: "text-yellow-500" },
  { type: "wow", icon: Zap, label: "Wow", color: "text-blue-500" },
  { type: "sad", icon: Frown, label: "Sad", color: "text-gray-500" },
  { type: "angry", icon: Angry, label: "Angry", color: "text-red-600" },
]

export function CompletePostCard({ post, onPostUpdate, onPostDelete }: PostCardProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [showComments, setShowComments] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false)
  const [reactions, setReactions] = useState(post.reactions || {})
  const [userReaction, setUserReaction] = useState(post.user_reaction || null)
  const [isVoting, setIsVoting] = useState(false)
  const [localVoteCount, setLocalVoteCount] = useState(post.vote_count || 0)
  const [localHasVoted, setLocalHasVoted] = useState(post.has_voted || false)
  const [viewCount, setViewCount] = useState(post.view_count || 0)
  const reactionsRef = useRef<HTMLDivElement>(null)

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  // Track post view
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && post.user?.id !== profile?.id) {
        handleTrackView()
      }
    }, 3000) // Track view after 3 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleTrackView = async () => {
    try {
      await fetch(`/api/community/posts/${post.id}/view`, { method: "POST" })
      setViewCount((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to track view:", error)
    }
  }

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

    if (post.user?.id === profile.id) {
      toast({
        title: "Cannot Vote",
        description: "You cannot vote on your own post.",
        variant: "destructive",
      })
      return
    }

    setIsVoting(true)
    const newHasVoted = !localHasVoted
    const newVoteCount = newHasVoted ? localVoteCount + 1 : localVoteCount - 1

    // Optimistic update
    setLocalHasVoted(newHasVoted)
    setLocalVoteCount(newVoteCount)

    try {
      const response = await fetch(`/api/community/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newHasVoted ? "add" : "remove" }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: newHasVoted ? "Vote Added! 🎉" : "Vote Removed",
          description: `100 Erigga Coins ${newHasVoted ? "transferred to" : "refunded from"} @${post.user?.username}`,
          duration: 3000,
        })
        onPostUpdate?.({ ...post, vote_count: newVoteCount, has_voted: newHasVoted })
      } else {
        // Revert on error
        setLocalHasVoted(!newHasVoted)
        setLocalVoteCount(localVoteCount)
        toast({
          title: "Vote Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revert on error
      setLocalHasVoted(!newHasVoted)
      setLocalVoteCount(localVoteCount)
      toast({
        title: "Vote Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }, [user, profile, post, localVoteCount, localHasVoted, toast, onPostUpdate])

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to react to posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: reactionType }),
      })

      const result = await response.json()

      if (result.success) {
        setReactions(result.reactions)
        setUserReaction(result.userReaction)
        setShowReactions(false)
        toast({
          title: "Reaction Added! 😊",
          description: `You reacted with ${reactionType}`,
        })
      }
    } catch (error) {
      toast({
        title: "Reaction Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${post.id}/bookmark`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        setIsBookmarked(result.bookmarked)
        toast({
          title: result.bookmarked ? "Post Bookmarked! 📌" : "Bookmark Removed",
          description: result.bookmarked ? "Added to your bookmarks" : "Removed from your bookmarks",
        })
      }
    } catch (error) {
      toast({
        title: "Bookmark Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/community/post/${post.id}`
    const shareData = {
      title: `Post by @${post.user?.username}`,
      text: post.content.substring(0, 100) + "...",
      url,
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        toast({ title: "Shared Successfully! 🎉" })
      } catch (error) {
        if (error.name !== "AbortError") {
          await navigator.clipboard.writeText(url)
          toast({ title: "Link Copied!", description: "Post link copied to clipboard." })
        }
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link Copied!", description: "Post link copied to clipboard." })
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const response = await fetch(`/api/community/posts/${post.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Post Deleted", description: "Your post has been deleted." })
        onPostDelete?.(post.id)
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  // Extract hashtags from content
  const extractHashtags = (content: string) => {
    const hashtagRegex = /#[\w]+/g
    return content.match(hashtagRegex) || []
  }

  // Extract mentions from content
  const extractMentions = (content: string) => {
    const mentionRegex = /@[\w]+/g
    return content.match(mentionRegex) || []
  }

  const hashtags = extractHashtags(post.content)
  const mentions = extractMentions(post.content)

  // Render content with clickable hashtags and mentions
  const renderContent = (content: string) => {
    let processedContent = content

    // Replace hashtags
    hashtags.forEach((hashtag) => {
      const hashtagName = hashtag.slice(1)
      processedContent = processedContent.replace(
        hashtag,
        `<a href="/community?hashtag=${hashtagName}" class="text-blue-500 hover:text-blue-600 font-medium">${hashtag}</a>`,
      )
    })

    // Replace mentions
    mentions.forEach((mention) => {
      const username = mention.slice(1)
      processedContent = processedContent.replace(
        mention,
        `<a href="/profile/${username}" class="text-purple-500 hover:text-purple-600 font-medium">${mention}</a>`,
      )
    })

    return { __html: processedContent }
  }

  const totalReactions = Object.values(reactions).reduce((sum: number, count: any) => sum + count, 0)

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
      <CardHeader className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <Link href={`/profile/${post.user?.username || post.user_id}`}>
              <Avatar className="h-12 w-12 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} alt={post.user?.username} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                  {post.user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${post.user?.username || post.user_id}`} className="hover:underline">
                  <span className="font-bold text-lg truncate">{post.user?.full_name || post.user?.username}</span>
                </Link>
                <span className="text-muted-foreground text-sm">@{post.user?.username}</span>
                {post.user?.tier && <UserTierBadge tier={post.user.tier} size="sm" />}
                {post.user?.id !== profile?.id && <FollowButton userId={post.user?.id} username={post.user?.username} />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{timeAgo}</span>
                {post.category && (
                  <>
                    <span>•</span>
                    <Link href={`/community?category=${post.category.slug}`} className="hover:underline text-primary">
                      {post.category.name}
                    </Link>
                  </>
                )}
                {post.is_edited && <Badge variant="outline">edited</Badge>}
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
                <DropdownMenuItem onClick={handleBookmark}>
                  <Bookmark className={cn("mr-2 h-4 w-4", isBookmarked && "fill-current")} />
                  {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.id === post.user?.auth_user_id ? (
                  <>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Flag className="mr-2 h-4 w-4" />
                    Report Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-4 space-y-4">
        <div
          className="prose prose-sm max-w-none dark:prose-invert leading-relaxed"
          dangerouslySetInnerHTML={renderContent(post.content)}
        />

        {/* Media Display */}
        {post.media_url && (
          <div className="rounded-xl overflow-hidden border">
            {post.media_type === "image" && (
              <img
                src={post.media_url || "/placeholder.svg"}
                alt="Post media"
                className="w-full h-auto max-h-[600px] object-contain bg-slate-50 dark:bg-slate-800"
                loading="lazy"
              />
            )}
            {post.media_type === "video" && (
              <video src={post.media_url} controls className="w-full h-auto max-h-[600px] rounded-xl" />
            )}
            {post.media_type === "audio" && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <audio src={post.media_url} controls className="w-full" />
              </div>
            )}
          </div>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {hashtags.slice(0, 5).map((hashtag: string, index: number) => (
              <Link key={index} href={`/community?hashtag=${hashtag.slice(1)}`}>
                <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                  <Hash className="h-3 w-3 mr-1" />
                  {hashtag.slice(1)}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 py-4 flex items-center justify-between border-t bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-1">
          {/* Vote Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-200",
              localHasVoted && "text-green-600 bg-green-50 dark:bg-green-900/20",
              isVoting && "animate-pulse",
            )}
            onClick={handleVote}
            disabled={isVoting || !user || post.user?.id === profile?.id}
          >
            <ArrowBigUp className={cn("h-5 w-5", localHasVoted && "fill-current")} />
            <span className="font-medium">{localVoteCount}</span>
            <Coins className="h-4 w-4 text-yellow-500" />
          </Button>

          {/* Reactions */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => setShowReactions(!showReactions)}
            >
              {userReaction ? (
                <>
                  {REACTIONS.find((r) => r.type === userReaction)?.icon && (\
                    <REACTIONS.find((r) => r.type === userReaction)!.icon className="mr-2 h-4 w-4" />}
                  {totalReactions}
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  {totalReactions}
                </>
              )}
            </Button>

            {showReactions && (
              <div
                ref={reactionsRef}
                className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-2 flex gap-1 z-10"
              >
                {REACTIONS.map((reaction) => (
                  <Button
                    key={reaction.type}
                    variant="ghost"
                    size="sm"
                    className={cn("p-2", reaction.color)}
                    onClick={() => handleReaction(reaction.type)}
                    title={reaction.label}
                  >
                    <reaction.icon className="h-5 w-5" />
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {post.comment_count || 0}
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{viewCount}</span>
          </div>
          {post.is_trending && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              🔥 Trending
            </Badge>
          )}
        </div>
      </CardFooter>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t">
          <CommentSection postId={post.id} />
        </div>
      )}
    </Card>
  )
}
