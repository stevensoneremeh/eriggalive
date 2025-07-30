"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, MapPin, Calendar, Globe, MessageCircle, ThumbsUp, Trophy, Coins, Users } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface UserProfile {
  id: number
  auth_user_id: string
  username: string
  display_name: string
  full_name: string
  email: string
  subscription_tier: string
  coins_balance: number
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  total_posts: number
  total_votes_received: number
  total_comments: number
  is_verified: boolean
  is_active: boolean
  last_seen_at: string
  created_at: string
  updated_at: string
}

interface Post {
  id: number
  title: string
  content: string
  vote_count: number
  comment_count: number
  created_at: string
  category: {
    name: string
    slug: string
  }
}

export default function ProfilePage() {
  const params = useParams()
  const { user, profile: currentUserProfile, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const username = params.username as string
  const supabase = createClient()
  const isOwnProfile = currentUserProfile?.username === username

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .single()

        if (profileError) {
          setError("Profile not found")
          return
        }

        setProfile(profileData)

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from("community_posts")
          .select(
            `
            id,
            title,
            content,
            vote_count,
            comment_count,
            created_at,
            category:community_categories(name, slug)
          `,
          )
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (!postsError && postsData) {
          setPosts(postsData)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username, supabase])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>The user profile you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/community">Browse Community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-purple-500"
      case "gold":
        return "bg-yellow-500"
      case "silver":
        return "bg-gray-400"
      case "bronze":
        return "bg-amber-600"
      default:
        return "bg-green-500"
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "platinum":
      case "gold":
      case "silver":
        return Trophy
      case "bronze":
        return Users
      default:
        return User
    }
  }

  const TierIcon = getTierIcon(profile.subscription_tier)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={`${getTierColor(profile.subscription_tier)} text-white`}>
                  <TierIcon className="w-3 h-3 mr-1" />
                  {profile.subscription_tier}
                </Badge>
                {profile.is_verified && <Badge variant="default">Verified</Badge>}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{profile.display_name}</h1>
                  <p className="text-muted-foreground mb-2">@{profile.username}</p>
                  {profile.bio && <p className="text-sm mb-4">{profile.bio}</p>}
                </div>
                {isOwnProfile && (
                  <Button asChild>
                    <Link href="/profile">Edit Profile</Link>
                  </Button>
                )}
              </div>

              {/* Profile Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{profile.total_posts}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{profile.total_comments}</div>
                  <div className="text-sm text-muted-foreground">Comments</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{profile.total_votes_received}</div>
                  <div className="text-sm text-muted-foreground">Votes</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    {profile.coins_balance}
                  </div>
                  <div className="text-sm text-muted-foreground">Coins</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Posts ({profile.total_posts})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({profile.total_comments})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        <Link href={`/community/posts/${post.id}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{post.category.name}</Badge>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {post.vote_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comment_count}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't created any posts yet."}
                </p>
                {isOwnProfile && (
                  <Button asChild className="mt-4">
                    <Link href="/community">Create Your First Post</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Comments</h3>
              <p className="text-muted-foreground">Comment history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Activity</h3>
              <p className="text-muted-foreground">Recent activity and achievements will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
