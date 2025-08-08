import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { HeroVideoCarousel } from "@/components/hero-video-carousel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Music, Users, Calendar, Trophy, Play, Heart, MessageCircle, TrendingUp, Star, Crown, Coins } from 'lucide-react'
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

// Keep your original server-side data fetching shape
async function getHomePageData() {
  const supabase = await createClient()

  try {
    const { data: tracks } = await supabase
      .from("tracks")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6)

    const { data: videos } = await supabase
      .from("videos")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4)

    const { data: communityPosts } = await supabase
      .from("community_posts")
      .select(
        `
        *,
        users!inner (username, full_name, avatar_url, tier)
      `,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3)

    return {
      tracks: tracks || [],
      videos: videos || [],
      communityPosts: communityPosts || [],
    }
  } catch (error) {
    console.error("Error fetching home page data:", error)
    return {
      tracks: [],
      videos: [],
      communityPosts: [],
    }
  }
}

function LatestTracks({ tracks }: { tracks: any[] }) {
  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Latest Tracks</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fresh sounds from the Paper Boy himself. Stream the latest releases and classics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <Card key={track.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={track.cover_image_url || "/placeholder.svg?height=300&width=300&query=cover%20image"}
                    alt={track.title || "Track cover"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button size="lg" className="rounded-full">
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{track.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{track.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{track.genre || "Hip Hop"}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {track?.created_at
                      ? formatDistanceToNow(new Date(track.created_at), { addSuffix: true })
                      : "Recently"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg">
            <Link href="/vault">
              <Music className="mr-2 h-5 w-5" />
              Explore All Music
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function CommunityHighlights({ posts }: { posts: any[] }) {
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

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Community Highlights</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what the community is talking about. Join the conversation and connect with fellow fans.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.users?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>
                        {(post.users?.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{post.users?.full_name || post.users?.username}</span>
                        <Badge className={getTierColor(post.users?.tier || "grassroot")}>
                          {(post.users?.tier || "grassroot").replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{post.users?.username} •{" "}
                        {post?.created_at
                          ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                          : "Just now"}
                      </p>
                    </div>
                  </div>

                  <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.vote_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comment_count || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Members</span>
                    <span className="font-semibold">12,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posts Today</span>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Discussions</span>
                    <span className="font-semibold">5,678</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "WarriKing", tier: "blood", points: 2500 },
                    { name: "PaperBoi", tier: "elder", points: 1800 },
                    { name: "StreetPoet", tier: "pioneer", points: 1200 },
                  ].map((user, index) => (
                    <div key={user.name} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-6">#{index + 1}</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              user.tier === "blood"
                                ? "bg-red-600 text-white"
                                : user.tier === "elder"
                                  ? "bg-purple-500 text-white"
                                  : "bg-blue-500 text-white"
                            }
                          >
                            {user.tier.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {user.points}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg">
            <Link href="/community">
              <Users className="mr-2 h-5 w-5" />
              Join the Community
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Music,
      title: "Exclusive Music",
      description: "Access to unreleased tracks, behind-the-scenes content, and exclusive remixes.",
      color: "text-purple-600",
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with fellow fans, share thoughts, and participate in discussions.",
      color: "text-blue-600",
    },
    {
      icon: Calendar,
      title: "Events",
      description: "Get early access to concert tickets, meet & greets, and special events.",
      color: "text-green-600",
    },
    {
      icon: Trophy,
      title: "Rewards",
      description: "Earn Erigga coins through participation and unlock exclusive perks.",
      color: "text-yellow-600",
    },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Join Erigga Live?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the ultimate fan platform with exclusive content, community features, and rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4 ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const { tracks, videos, communityPosts } = await getHomePageData()

  // Restore hero to the original pattern: full-bleed carousel with background video + images
  const heroImages: string[] = [
    "/images/hero/erigga1.jpeg",
    "/images/hero/erigga2.jpeg",
    "/images/hero/erigga3.jpeg",
    "/images/hero/erigga4.jpeg",
  ]

  // Try to use the latest published video URL if available; fall back to a safe placeholder
  const heroVideoUrl: string =
    (Array.isArray(videos) && videos[0]?.video_url) ||
    "/placeholder.svg?height=800&width=1200"

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        <Suspense
          fallback={
            <div className="h-[70vh] bg-gradient-to-r from-purple-900 to-blue-900 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">Erigga Live</h1>
                <p className="text-xl">The Ultimate Fan Experience</p>
              </div>
            </div>
          }
        >
          {/* Fixed: pass correct props (images, videoUrl) instead of videos */}
          <div className="relative h-[70vh] overflow-hidden">
            <HeroVideoCarousel images={heroImages} videoUrl={heroVideoUrl} />
            {/* Overlay content retained */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">Erigga Live</h1>
                <p className="text-xl opacity-90 mb-6">The Ultimate Fan Experience</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/signup">
                      <Star className="mr-2 h-5 w-5" />
                      Get Started Free
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-white border-white hover:bg-white hover:text-purple-600"
                  >
                    <Link href="/premium">
                      <Crown className="mr-2 h-5 w-5" />
                      Go Premium
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Suspense>
      </section>

      {/* Latest Tracks */}
      <LatestTracks tracks={tracks} />

      {/* Community Highlights */}
      <CommunityHighlights posts={communityPosts} />

      {/* Features */}
      <FeaturesSection />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Movement?</h2>
          <p className="text-xl mb-8 opacity-90">Get exclusive access to Erigga&apos;s world and connect with the community.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">
                <Star className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-purple-600"
            >
              <Link href="/premium">
                <Crown className="mr-2 h-5 w-5" />
                Go Premium
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
