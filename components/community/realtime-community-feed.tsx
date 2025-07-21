"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useAbly } from "@/contexts/ably-context"
import { formatDistanceToNow } from "date-fns"
import { ArrowBigUp, MessageCircle, Share2, Eye, Hash, Bookmark, BookmarkCheck, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommunityFeedProps {
  initialPosts?: any[]
}

export function RealtimeCommunityFeed({ initialPosts = [] }: CommunityFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { isConnected, subscribeToFeed, subscribeToPostVotes } = useAbly()

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/community/posts")
      const data = await response.json()

      if (data.success) {
        setPosts(data.posts)
      } else {
        throw new Error(data.error || "Failed to fetch posts")
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts()
    }
  }, [initialPosts.length])

  useEffect(() => {
    const unsubscribe = subscribeToFeed((data) => {
      if (data.post) {
        setPosts((prevPosts) => [data.post, ...prevPosts])
        toast({
          title: "New Post! 🎉",
          description: `${data.post.user?.username} shared something new`,
        })
      }
    })

    return unsubscribe
  }, [subscribeToFeed, toast])

  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    posts.forEach((post) => {
      const unsubscribe = subscribeToPostVotes(post.id, (data) => {
        if (data.userId !== user?.id) {
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if (p.id === data.postId) {
                return {
                  ...p,
                  vote_count: data.voteCount,
                }
              }
              return p
            }),
          )
        }
      })
      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [posts, subscribeToPostVotes, user?.id])

  const handleVote = async (postId: number, hasVoted: boolean) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to vote on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/community/posts/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      })

      const data = await response.json()

      if (data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                has_voted: data.voted,
                vote_count: data.voteCount,
              }
            }
            return post
          }),
        )

        toast({
          title: data.voted ? "Vote Added! 🎉" : "Vote Removed",
          description: data.message,
        })
      } else {
        throw new Error(data.error || "Failed to vote")
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Vote Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBookmark = async (postId: number, isBookmarked: boolean) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/bookmark`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                is_bookmarked: data.bookmarked,
              }
            }
            return post
          }),
        )

        toast({
          title: data.bookmarked ? "Bookmarked! 📌" : "Bookmark Removed",
          description: data.message,
        })
      } else {
        throw new Error(data.error || "Failed to bookmark")
      }
    } catch (error) {
      console.error("Error bookmarking:", error)
      toast({
        title: "Bookmark Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getTierColor = (tier: string) => {
    const colors = {
      admin: "bg-red-500 text-white",
      blood: "bg-red-600 text-white",
      elder: "bg-purple-500 text-white",
      pioneer: "bg-blue-500 text-white",
      grassroot: "bg-green-500 text-white",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500 text-white"
  }

  const renderContent = (content: string) => {
    let processedContent = content.replace(
      /#(\w+)/g,
      '<span class="text-blue-500 font-medium cursor-pointer hover:text-blue-600">#$1</span>',
    )

    processedContent = processedContent.replace(
      /@(\w+)/g,
      '<span class="text-purple-500 font-medium cursor-pointer hover:text-purple-600">@$1</span>',
    )

    return { __html: processedContent }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-gray-500 dark:text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p>Be the first to share something with the community!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span>Live updates enabled</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span>Offline mode</span>
            </>
          )}
        </div>
      </div>

      {posts.map((post) => (
        <Card
          key={post.id}
          className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800"
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                  <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} alt={post.user?.username} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                    {post.user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg">{post.user?.full_name || post.user?.username}</span>
                    <Badge className={getTierColor(post.user?.tier)}>
                      {post.user?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>@{post.user?.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    {post.category && (
                      <>
                        <span>•</span>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: post.category.color + "20",
                            borderColor: post.category.color,
                            color: post.category.color,
                          }}
                        >
                          {post.category.icon} {post.category.name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <div
              className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-gray-800 dark:text-gray-200"
              dangerouslySetInnerHTML={renderContent(post.content)}
            />

            {post.media_url && (
              <div className="mt-4">
                {post.media_type?.startsWith("image") ? (
                  <img
                    src={post.media_url || "/placeholder.svg"}
                    alt="Post media"
                    className="rounded-lg max-w-full h-auto"
                    loading="lazy"
                  />
                ) : post.media_type?.startsWith("video") ? (
                  <video src={post.media_url} controls className="rounded-lg max-w-full h-auto" preload="metadata" />
                ) : null}
              </div>
            )}

            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.hashtags.slice(0, 5).map((hashtag: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {hashtag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-4 border-t bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/20",
                    post.has_voted && "text-green-600 bg-green-50 dark:bg-green-900/20",
                  )}
                  onClick={() => handleVote(post.id, post.has_voted)}
                  disabled={post.user?.id === user?.id}
                >
                  <ArrowBigUp className={cn("h-5 w-5", post.has_voted && "fill-current")} />
                  <span className="font-medium">{post.vote_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comment_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20",
                    post.is_bookmarked && "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
                  )}
                  onClick={() => handleBookmark(post.id, post.is_bookmarked)}
                >
                  {post.is_bookmarked ? (
                    <BookmarkCheck className="h-4 w-4 fill-current" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count || 0}</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
