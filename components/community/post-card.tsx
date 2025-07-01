"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThumbsUp, ThumbsDown, MessageCircle, Bookmark, Share2, MoreHorizontal, Flag, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    author_id: string
    upvotes: number
    downvotes: number
    comment_count: number
    view_count: number
    created_at: string
    profiles: {
      username: string
      display_name?: string
      avatar_url?: string
    }
    categories: {
      name: string
      color: string
      icon?: string
    }
  }
}

export function PostCard({ post }: PostCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)

  const handleVote = (type: "up" | "down") => {
    // Toggle vote or change vote type
    if (userVote === type) {
      setUserVote(null)
    } else {
      setUserVote(type)
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  return (
    <Card className="bg-background/50 border-muted hover:bg-background/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {(post.profiles.display_name || post.profiles.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <Link
                  href={`/profile/${post.profiles.username}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {post.profiles.display_name || post.profiles.username}
                </Link>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {post.categories && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: `${post.categories.color}20`, color: post.categories.color }}
                  >
                    {post.categories.icon} {post.categories.name}
                  </Badge>
                )}
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{post.view_count}</span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link href={`/community/post/${post.id}`} className="block group">
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
          <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
        </Link>

        <div className="flex items-center justify-between pt-4 border-t border-muted">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("up")}
                className={cn("h-8 px-2", userVote === "up" && "text-green-600 bg-green-600/10")}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                <span className="text-sm">{post.upvotes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("down")}
                className={cn("h-8 px-2", userVote === "down" && "text-red-600 bg-red-600/10")}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                <span className="text-sm">{post.downvotes}</span>
              </Button>
            </div>

            <Button variant="ghost" size="sm" asChild>
              <Link href={`/community/post/${post.id}`} className="h-8 px-2">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{post.comment_count}</span>
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn("h-8 px-2", isBookmarked && "text-yellow-600 bg-yellow-600/10")}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
