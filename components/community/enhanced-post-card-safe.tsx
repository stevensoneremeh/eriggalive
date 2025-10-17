"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserTierBadge } from "@/components/user-tier-badge"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, MoreHorizontal, ArrowBigUp, Coins, Share2, Bookmark, Eye, Hash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useCommunity } from "@/contexts/community-context"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// This is a SAFE enhanced version that doesn't break existing functionality
export function EnhancedPostCardSafe({ post, onVoteUpdate }: any) {
  const { user, profile } = useAuth()
  const { voteOnPost } = useCommunity()
  const { toast } = useToast()
  const [isVoting, setIsVoting] = useState(false)
  const [localVoteCount, setLocalVoteCount] = useState(post.vote_count || 0)
  const [localHasVoted, setLocalHasVoted] = useState(post.has_voted || false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

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

    setIsVoting(true)

    // Optimistic update
    const newHasVoted = !localHasVoted
    const newVoteCount = newHasVoted ? localVoteCount + 1 : localVoteCount - 1
    setLocalHasVoted(newHasVoted)
    setLocalVoteCount(newVoteCount)

    try {
      const result = await voteOnPost(post.id, post.user?.auth_user_id || "")
      if (result.success) {
        toast({
          title: newHasVoted ? "Vote Added! 🎉" : "Vote Removed",
          description: `100 Erigga Coins ${newHasVoted ? "transferred to" : "refunded from"} the post creator.`,
          duration: 3000,
        })
        onVoteUpdate?.(newVoteCount, newHasVoted)
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
  }, [user, profile, post, voteOnPost, toast, localVoteCount, localHasVoted, onVoteUpdate])

  const handleShare = async () => {
    const url = `${window.location.origin}/community/post/${post.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.user?.username}`,
          text: post.content.substring(0, 100) + "...",
          url,
        })
      } catch (error) {
        await navigator.clipboard.writeText(url)
        toast({ title: "Link Copied!", description: "Post link copied to clipboard." })
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link Copied!", description: "Post link copied to clipboard." })
    }
  }

  const handleBookmark = async () => {
    // This would call a bookmark API
    setIsBookmarked(!isBookmarked)
    toast({
      title: isBookmarked ? "Bookmark Removed" : "Post Bookmarked!",
      description: isBookmarked ? "Removed from your bookmarks" : "Added to your bookmarks",
    })
  }

  // Extract hashtags from content (safe function)
  const extractHashtags = (content: string) => {
    const hashtagRegex = /#[\w]+/g
    return content.match(hashtagRegex) || []
  }

  const hashtags = post.hashtags || extractHashtags(post.content)

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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-4 space-y-4">
        <div className="prose prose-sm max-w-none dark:prose-invert">{post.content}</div>

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

        {/* Media Display - Keep existing functionality */}
        {post.media_url && (
          <div className="rounded-xl overflow-hidden">
            <img
              src={post.media_url || "/placeholder.svg"}
              alt="Post media"
              className="w-full h-auto max-h-[600px] object-contain bg-slate-50 dark:bg-slate-800 rounded-xl"
              loading="lazy"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 py-4 flex items-center justify-between border-t bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-200",
              localHasVoted && "text-red-500 bg-red-50 dark:bg-red-900/20",
              isVoting && "animate-pulse",
            )}
            onClick={handleVote}
            disabled={isVoting || !user}
          >
            <ArrowBigUp className={cn("h-5 w-5", localHasVoted && "fill-current")} />
            <span className="font-medium">{localVoteCount}</span>
            <Coins className="h-4 w-4 text-yellow-500" />
          </Button>

          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
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
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.view_count || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
