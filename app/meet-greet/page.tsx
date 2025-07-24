"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Video, Star, Gift, Coins } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface MeetGreetSession {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: number
  max_participants: number
  current_participants: number
  tier_required: string
  coin_cost: number
  status: "upcoming" | "live" | "completed"
  meeting_link?: string
}

export default function MeetGreetPage() {
  const { profile, isAuthenticated } = useAuth()
  const [sessions, setSessions] = useState<MeetGreetSession[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingSession, setBookingSession] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockSessions: MeetGreetSession[] = [
        {
          id: "1",
          title: "Exclusive Chat with Erigga",
          description: "Join Erigga for an intimate conversation about his latest projects and music journey.",
          date: "2024-02-15",
          time: "19:00",
          duration: 60,
          max_participants: 20,
          current_participants: 12,
          tier_required: "elder",
          coin_cost: 500,
          status: "upcoming",
        },
        {
          id: "2",
          title: "Behind the Scenes Stories",
          description: "Get exclusive behind-the-scenes stories from Erigga's music videos and studio sessions.",
          date: "2024-02-20",
          time: "20:00",
          duration: 45,
          max_participants: 15,
          current_participants: 8,
          tier_required: "pioneer",
          coin_cost: 300,
          status: "upcoming",
        },
        {
          id: "3",
          title: "Q&A Session",
          description: "Ask Erigga your burning questions in this interactive Q&A session.",
          date: "2024-02-25",
          time: "18:30",
          duration: 90,
          max_participants: 30,
          current_participants: 25,
          tier_required: "grassroot",
          coin_cost: 200,
          status: "upcoming",
        },
      ]
      setSessions(mockSessions)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast.error("Failed to load meet & greet sessions")
    } finally {
      setLoading(false)
    }
  }

  const bookSession = async (sessionId: string) => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to book a session")
      return
    }

    setBookingSession(sessionId)

    try {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return

      // Check if user has enough coins
      if (profile.coins_balance < session.coin_cost) {
        toast.error("Insufficient coins. Please purchase more coins.")
        return
      }

      // Check tier requirement
      const tierHierarchy = { grassroot: 1, pioneer: 2, elder: 3, blood: 4 }
      const userTierLevel = tierHierarchy[profile.tier as keyof typeof tierHierarchy] || 1
      const requiredTierLevel = tierHierarchy[session.tier_required as keyof typeof tierHierarchy] || 1

      if (userTierLevel < requiredTierLevel) {
        toast.error(`This session requires ${session.tier_required} tier or higher`)
        return
      }

      // Mock booking - replace with actual Supabase mutation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Session booked successfully! Check your email for meeting details.")

      // Update session participants count
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, current_participants: s.current_participants + 1 } : s)),
      )
    } catch (error) {
      console.error("Error booking session:", error)
      toast.error("Failed to book session. Please try again.")
    } finally {
      setBookingSession(null)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return "Blood Brotherhood"
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

  const canBookSession = (session: MeetGreetSession) => {
    if (!profile) return false

    const tierHierarchy = { grassroot: 1, pioneer: 2, elder: 3, blood: 4 }
    const userTierLevel = tierHierarchy[profile.tier as keyof typeof tierHierarchy] || 1
    const requiredTierLevel = tierHierarchy[session.tier_required as keyof typeof tierHierarchy] || 1

    return (
      userTierLevel >= requiredTierLevel &&
      profile.coins_balance >= session.coin_cost &&
      session.current_participants < session.max_participants
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Meet & Greet with Erigga</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get exclusive access to intimate sessions with Erigga. Share stories, ask questions, and connect with your
            favorite artist.
          </p>
        </div>

        {/* User Info */}
        {isAuthenticated && profile && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                    <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{profile.username}</h3>
                    <Badge className={`${getTierColor(profile.tier || "grassroot")} text-white`}>
                      {getTierDisplayName(profile.tier || "grassroot")}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{profile.coins_balance || 0} Coins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="live">Live Now</TabsTrigger>
            <TabsTrigger value="past">Past Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sessions
                .filter((s) => s.status === "upcoming")
                .map((session) => (
                  <Card key={session.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <Badge className={`${getTierColor(session.tier_required)} text-white`}>
                          {getTierDisplayName(session.tier_required)}+
                        </Badge>
                      </div>
                      <CardDescription>{session.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{session.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {session.current_participants}/{session.max_participants}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span>{session.coin_cost} coins</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        {!isAuthenticated ? (
                          <Button className="w-full" asChild>
                            <a href="/login">Sign In to Book</a>
                          </Button>
                        ) : canBookSession(session) ? (
                          <Button
                            className="w-full"
                            onClick={() => bookSession(session.id)}
                            disabled={bookingSession === session.id}
                          >
                            {bookingSession === session.id ? "Booking..." : "Book Session"}
                          </Button>
                        ) : (
                          <Button className="w-full" disabled>
                            {session.current_participants >= session.max_participants
                              ? "Session Full"
                              : profile && profile.coins_balance < session.coin_cost
                                ? "Insufficient Coins"
                                : "Tier Required"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="live">
            <div className="text-center py-12">
              <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Live Sessions</h3>
              <p className="text-muted-foreground">Check back later for live meet & greet sessions.</p>
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="text-center py-12">
              <Star className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Past Sessions</h3>
              <p className="text-muted-foreground">Your completed sessions will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>How Meet & Greet Works</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Booking Requirements</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Must have required tier membership</li>
                  <li>• Sufficient coin balance</li>
                  <li>• Available spots in session</li>
                  <li>• Valid account in good standing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What to Expect</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Interactive video sessions</li>
                  <li>• Q&A opportunities</li>
                  <li>• Exclusive content and stories</li>
                  <li>• Limited participant groups</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
