"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Music, Users, Calendar, TrendingUp, Clock, Home, Coins, Crown, Gift, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

// Mock data for the dashboard
const mockRecentTracks = [
  { id: 1, title: "Send Her Money", artist: "Erigga ft. Yemi Alade", plays: 5200000 },
  { id: 2, title: "The Fear of God", artist: "Erigga", plays: 3800000 },
  { id: 3, title: "Area to the World", artist: "Erigga ft. Zlatan", plays: 4100000 },
]

const mockUpcomingEvents = [
  { id: 1, title: "Erigga Live in Lagos", date: "Dec 31, 2024", venue: "Eko Hotel & Suites" },
  { id: 2, title: "Street Motivation Tour - Abuja", date: "Nov 15, 2024", venue: "ICC Abuja" },
]

const mockCommunityPosts = [
  { id: 1, author: "PaperBoi_Fan", content: "Just got my tickets for the Lagos show! Who else is going?", likes: 24 },
  { id: 2, author: "WarriToTheWorld", content: "That new freestyle is 🔥🔥🔥", likes: 18 },
]

export default function DashboardPage() {
  const { profile, isAuthenticated, isLoading, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      toast.error("Please sign in to access your dashboard")
      router.push("/login?redirect=/dashboard")
      return
    }

    // If authenticated but no profile, try to refresh profile
    if (isAuthenticated && !profile) {
      const loadProfile = async () => {
        try {
          await refreshProfile()
        } catch (err) {
          console.error("Error loading profile:", err)
          setError("Failed to load your profile. Please try refreshing the page.")
        }
      }
      loadProfile()
    }
  }, [isAuthenticated, isLoading, profile, router, refreshProfile])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-2 h-48" />
            <Skeleton className="col-span-4 h-48" />
            <Skeleton className="col-span-3 h-48" />
          </div>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    )
  }

  // Handle not authenticated state
  if (!isAuthenticated || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Your Dashboard</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access your personalized dashboard</p>
            <div className="space-x-4">
              <Button asChild>
                <Link href="/login?redirect=/dashboard">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Dashboard</span>
        </nav>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile.username || "Fan"}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your Erigga fan account today.</p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
                  <Coins className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.coins_balance || 0} Coins</div>
                  <p className="text-xs text-muted-foreground">Use coins to unlock premium content</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{getTierDisplayName(profile.tier)}</div>
                  <p className="text-xs text-muted-foreground">{getTierDescription(profile.tier)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Events in the next 3 months</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Releases</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">New tracks this month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your account and explore content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button asChild className="bg-green-500 hover:bg-green-600">
                      <Link href="/coins">
                        <Coins className="h-4 w-4 mr-2" />
                        Manage Coins
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/community">
                        <Users className="h-4 w-4 mr-2" />
                        Community
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/chat">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat Rooms
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/rooms/freebies">
                        <Gift className="h-4 w-4 mr-2" />
                        Freebies
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Tracks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentTracks.map((track) => (
                      <div key={track.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                          <span className="text-sm">{formatNumber(track.plays)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUpcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.venue}</p>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                          <span className="text-sm">{event.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Community Activity</CardTitle>
                <CardDescription>Recent posts from the Erigga fan community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCommunityPosts.map((post) => (
                    <div key={post.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <span className="font-medium mr-2">{post.author}</span>
                        <span className="text-xs text-muted-foreground">Posted recently</span>
                      </div>
                      <p>{post.content}</p>
                      <div className="flex items-center mt-2 text-sm text-muted-foreground">
                        <span>{post.likes} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Music Library</CardTitle>
                <CardDescription>Access your favorite Erigga tracks and albums</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Visit the Media Vault for full access to music content.</p>
                <Button asChild className="mt-4">
                  <Link href="/vault">
                    <Music className="h-4 w-4 mr-2" />
                    Open Media Vault
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Feed</CardTitle>
                <CardDescription>Connect with other Erigga fans</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Visit the Community page to see all posts and discussions.</p>
                <Button asChild className="mt-4">
                  <Link href="/community">
                    <Users className="h-4 w-4 mr-2" />
                    Join Community
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Concerts, tours, and meet & greets</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Visit the Events page to see all upcoming events and purchase tickets.</p>
                <Button asChild className="mt-4">
                  <Link href="/chronicles">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Events
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

// Helper function to get tier descriptions
function getTierDescription(tier: string): string {
  switch (tier?.toLowerCase()) {
    case "blood_brotherhood":
    case "blood":
      return "VIP access to all content and events"
    case "elder":
      return "Exclusive content and event discounts"
    case "pioneer":
      return "Early access to new releases"
    case "grassroot":
      return "Basic access to content"
    default:
      return "Fan membership tier"
  }
}

// Helper function to get tier display names
function getTierDisplayName(tier: string): string {
  switch (tier?.toLowerCase()) {
    case "blood_brotherhood":
    case "blood":
      return "Blood"
    case "elder":
      return "Elder"
    case "pioneer":
      return "Pioneer"
    case "grassroot":
      return "Grassroot"
    default:
      return "Fan"
  }
}
