"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { CreatePostForm } from "@/components/community/create-post-form"
import { PostFeed } from "@/components/community/post-feed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Crown, 
  Coins,
  Bell,
  Settings,
  LogIn,
  UserPlus 
} from "lucide-react"
import Link from "next/link"

interface CommunityPageClientProps {
  user: any
  profile: any
  initialPosts: any[]
  categories: any[]
}

export function CommunityPageClient({ user, profile, initialPosts, categories }: CommunityPageClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("community_realtime")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "community_posts",
          filter: `is_published=eq.true`
        },
        (payload) => {
          console.log("Post change received:", payload)
          refreshPosts()
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "community_post_votes" 
        },
        (payload) => {
          console.log("Vote change received:", payload)
          refreshPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const refreshPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug),
          votes:community_post_votes(user_id)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data && !error) {
        const postsWithVoteStatus = data.map((post: any) => ({
          ...post,
          has_voted: profile 
            ? post.votes.some((vote: any) => vote.user_id === profile.id)
            : false,
        }))
        setPosts(postsWithVoteStatus)
      }
    } catch (error) {
      console.error("Error refreshing posts:", error)
    }
  }

  const handlePostCreated = (newPost: any) => {
    setPosts(prev => [newPost, ...prev])
    toast({
      title: "Post Created!",
      description: "Your post has been shared with the community.",
    })
  }

  const handleVoteUpdate = (postId: number, newVoteCount: number, hasVoted: boolean) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, vote_count: newVoteCount, has_voted: hasVoted }
        : post
    ))
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">Join the Erigga Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Connect with fellow fans, share your bars, and be part of the movement.
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/signup">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Show public posts for non-authenticated users */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recent Community Posts</h2>
            <PostFeed 
              initialPosts={posts} 
              userId={undefined}
              onVoteUpdate={handleVoteUpdate}
              categories={categories}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{profile?.full_name || profile?.username}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {profile?.tier || 'grassroot'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Coins</span>
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                    {profile?.coins || 1000}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Posts</span>
                  <span>{profile?.posts_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reputation</span>
                  <span>{profile?.reputation_score || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`/community?category=${category.id}`}>
                      {category.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <CreatePostForm 
            categories={categories} 
            userId={user.id}
            onPostCreated={handlePostCreated}
          />
          
          <Tabs defaultValue="latest" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="top">Top</TabsTrigger>
            </TabsList>
            <TabsContent value="latest">
              <PostFeed 
                initialPosts={posts} 
                userId={user.id}
                onVoteUpdate={handleVoteUpdate}
                categories={categories}
                sortOrder="newest"
              />
            </TabsContent>
            <TabsContent value="trending">
              <PostFeed 
                initialPosts={posts} 
                userId={user.id}
                onVoteUpdate={handleVoteUpdate}
                categories={categories}
                sortOrder="top"
              />
            </TabsContent>
            <TabsContent value="top">
              <PostFeed 
                initialPosts={posts} 
                userId={user.id}
                onVoteUpdate={handleVoteUpdate}
                categories={categories}
                sortOrder="top"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          {/* Community Stats */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Members</span>
                  </div>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Posts Today</span>
                  </div>
                  <span className="font-semibold">56</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>Top Contributors</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-2 bg-muted rounded-lg text-sm">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-muted-foreground text-xs">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
