"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommunityPost } from "@/components/community-post"
import { CreatePost } from "@/components/create-post"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

type Post = {
  id: string
  user_id: string
  username: string
  user_tier: string
  content: string
  media_url?: string
  media_type?: string
  created_at: string
  upvotes: number
  downvotes: number
  comments_count: number
  has_voted?: boolean | null
  vote_type?: "up" | "down" | null
}

export function CommunityContent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const { user, profile, isPreviewMode } = useAuth()

  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  const fetchPosts = async () => {
    setLoading(true)

    try {
      if (isPreviewMode) {
        // Mock data for preview mode
        setTimeout(() => {
          setPosts(getMockPosts())
          setLoading(false)
        }, 1000)
        return
      }

      // Real data fetching would go here
      // const { data, error } = await supabase...

      // For now, use mock data
      setPosts(getMockPosts())
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMockPosts = (): Post[] => {
    return [
      {
        id: "1",
        user_id: "user1",
        username: "EriggaFan1",
        user_tier: "pioneer",
        content: "Just listened to the new track! 🔥 What do you all think about it?",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        upvotes: 24,
        downvotes: 2,
        comments_count: 7,
        has_voted: true,
        vote_type: "up",
      },
      {
        id: "2",
        user_id: "user2",
        username: "PaperBoi",
        user_tier: "elder",
        content: "Who's going to the concert next month? Looking to meet up with fellow fans!",
        media_url: "/placeholder.svg?height=400&width=600",
        media_type: "image",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 42,
        downvotes: 0,
        comments_count: 15,
      },
      {
        id: "3",
        user_id: "user3",
        username: "WarriVibes",
        user_tier: "blood_brotherhood",
        content: "I made this fan art for Erigga. Took me 3 days to complete! What do you think?",
        media_url: "/placeholder.svg?height=600&width=600",
        media_type: "image",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 156,
        downvotes: 2,
        comments_count: 32,
      },
      {
        id: "4",
        user_id: "user4",
        username: "LyricsKing",
        user_tier: "grassroot",
        content: "What's everyone's favorite Erigga lyric? Mine has to be from 'Industry Night'",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 89,
        downvotes: 3,
        comments_count: 47,
      },
    ]
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts])
  }

  const handleVote = (postId: string, voteType: "up" | "down") => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const isChangingVote = post.has_voted && post.vote_type !== voteType
          const isRemovingVote = post.has_voted && post.vote_type === voteType

          let newUpvotes = post.upvotes
          let newDownvotes = post.downvotes

          // Remove previous vote if changing vote
          if (isChangingVote) {
            if (post.vote_type === "up") newUpvotes--
            if (post.vote_type === "down") newDownvotes--
          }

          // Add or remove current vote
          if (isRemovingVote) {
            if (voteType === "up") newUpvotes--
            if (voteType === "down") newDownvotes--
            return {
              ...post,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              has_voted: false,
              vote_type: null,
            }
          } else {
            if (voteType === "up") newUpvotes++
            if (voteType === "down") newDownvotes++
            return {
              ...post,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              has_voted: true,
              vote_type: voteType,
            }
          }
        }
        return post
      }),
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Create Post Section */}
      {user && (
        <div className="mb-8">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>
      )}

      {/* Tabs for filtering posts */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b dark:border-gray-800 mb-6">
          <TabsList className="bg-transparent w-full justify-start gap-4 h-auto p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-b-2 data-[state=active]:border-brand-teal dark:data-[state=active]:border-white data-[state=active]:shadow-none rounded-none bg-transparent px-2 py-3 text-base font-medium text-gray-700 dark:text-gray-300 data-[state=active]:text-brand-teal dark:data-[state=active]:text-white"
            >
              All Posts
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="data-[state=active]:border-b-2 data-[state=active]:border-brand-teal dark:data-[state=active]:border-white data-[state=active]:shadow-none rounded-none bg-transparent px-2 py-3 text-base font-medium text-gray-700 dark:text-gray-300 data-[state=active]:text-brand-teal dark:data-[state=active]:text-white"
            >
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="data-[state=active]:border-b-2 data-[state=active]:border-brand-teal dark:data-[state=active]:border-white data-[state=active]:shadow-none rounded-none bg-transparent px-2 py-3 text-base font-medium text-gray-700 dark:text-gray-300 data-[state=active]:text-brand-teal dark:data-[state=active]:text-white"
            >
              Media
            </TabsTrigger>
            {user && (
              <TabsTrigger
                value="following"
                className="data-[state=active]:border-b-2 data-[state=active]:border-brand-teal dark:data-[state=active]:border-white data-[state=active]:shadow-none rounded-none bg-transparent px-2 py-3 text-base font-medium text-gray-700 dark:text-gray-300 data-[state=active]:text-brand-teal dark:data-[state=active]:text-white"
              >
                Following
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal dark:text-white" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <CommunityPost key={post.id} post={post} onVote={handleVote} />
              ))}
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  className="border-brand-teal dark:border-gray-700 text-brand-teal dark:text-white"
                >
                  Load More
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No posts found. Be the first to post!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal dark:text-white" />
            </div>
          ) : (
            <div className="space-y-6">
              {posts
                .sort((a, b) => b.upvotes - a.upvotes)
                .slice(0, 3)
                .map((post) => (
                  <CommunityPost key={post.id} post={post} onVote={handleVote} />
                ))}
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  className="border-brand-teal dark:border-gray-700 text-brand-teal dark:text-white"
                >
                  Load More
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal dark:text-white" />
            </div>
          ) : (
            <div className="space-y-6">
              {posts
                .filter((post) => post.media_url)
                .map((post) => (
                  <CommunityPost key={post.id} post={post} onVote={handleVote} />
                ))}
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  className="border-brand-teal dark:border-gray-700 text-brand-teal dark:text-white"
                >
                  Load More
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {user && (
          <TabsContent value="following" className="mt-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-teal dark:text-white" />
              </div>
            ) : (
              <div className="space-y-6">
                {posts.slice(1, 3).map((post) => (
                  <CommunityPost key={post.id} post={post} onVote={handleVote} />
                ))}
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    className="border-brand-teal dark:border-gray-700 text-brand-teal dark:text-white"
                  >
                    Load More
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
