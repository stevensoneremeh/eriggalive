import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Users, Video, Crown, Star, Zap, Heart } from "lucide-react"

interface MeetGreetSession {
  id: string
  title: string
  description: string
  scheduled_start: string
  scheduled_end: string
  tier_access: string
  max_participants: number
  current_participants: number
  status: "scheduled" | "active" | "completed" | "cancelled"
  host: {
    username: string
    avatar_url?: string
    tier: string
  }
}

async function loadUsers() {
  const supabase = await createClient()

  try {
    // First, let's get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { users: [], currentUser: null, error: authError.message }
    }

    if (!user) {
      return { users: [], currentUser: null, error: "Not authenticated" }
    }

    // Get current user profile
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return { users: [], currentUser: null, error: profileError.message }
    }

    // Get all users for the meet & greet
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50)

    if (usersError) {
      console.error("Users error:", usersError)
      return { users: [], currentUser: currentUserProfile, error: usersError.message }
    }

    return {
      users: users || [],
      currentUser: currentUserProfile,
      error: null,
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return {
      users: [],
      currentUser: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Mock data for meet & greet sessions
const mockSessions: MeetGreetSession[] = [
  {
    id: "1",
    title: "Exclusive Blood Brotherhood Session",
    description: "Private meet & greet session for Blood Brotherhood members only. Limited to 5 participants.",
    scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    tier_access: "blood",
    max_participants: 5,
    current_participants: 2,
    status: "scheduled",
    host: {
      username: "eriggaofficial",
      avatar_url: "/placeholder-user.jpg",
      tier: "blood",
    },
  },
  {
    id: "2",
    title: "Elder Circle Discussion",
    description: "Join Erigga for an intimate discussion about upcoming projects and music.",
    scheduled_start: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 48 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    tier_access: "elder",
    max_participants: 10,
    current_participants: 7,
    status: "scheduled",
    host: {
      username: "eriggaofficial",
      avatar_url: "/placeholder-user.jpg",
      tier: "blood",
    },
  },
  {
    id: "3",
    title: "Pioneer Community Meetup",
    description: "Connect with fellow Pioneer members and get exclusive updates.",
    scheduled_start: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 72 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    tier_access: "pioneer",
    max_participants: 20,
    current_participants: 15,
    status: "scheduled",
    host: {
      username: "eriggaofficial",
      avatar_url: "/placeholder-user.jpg",
      tier: "blood",
    },
  },
]

function getTierIcon(tier: string) {
  switch (tier.toLowerCase()) {
    case "blood":
      return <Heart className="h-4 w-4 text-red-500" />
    case "elder":
      return <Crown className="h-4 w-4 text-purple-500" />
    case "pioneer":
      return <Zap className="h-4 w-4 text-blue-500" />
    case "grassroot":
      return <Star className="h-4 w-4 text-green-500" />
    default:
      return <Users className="h-4 w-4 text-gray-500" />
  }
}

function getTierColor(tier: string) {
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

function canAccessSession(userTier: string, sessionTier: string) {
  const tierHierarchy = ["grassroot", "pioneer", "elder", "blood"]
  const userTierIndex = tierHierarchy.indexOf(userTier.toLowerCase())
  const sessionTierIndex = tierHierarchy.indexOf(sessionTier.toLowerCase())

  return userTierIndex >= sessionTierIndex
}

export default async function MeetGreetPage() {
  const { users, currentUser, error } = await loadUsers()

  if (error) {
    redirect("/login?redirect=/meet-greet")
  }

  if (!currentUser) {
    redirect("/login?redirect=/meet-greet")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Meet & Greet</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Connect with Erigga and fellow fans in exclusive video sessions based on your tier membership.
            </p>
          </div>

          {/* User Tier Info */}
          <div className="mb-8">
            <Card className="bg-black/20 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={currentUser.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{currentUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{currentUser.username}</h3>
                      <div className="flex items-center space-x-2">
                        {getTierIcon(currentUser.tier || "grassroot")}
                        <Badge className={`${getTierColor(currentUser.tier || "grassroot")} text-white`}>
                          {currentUser.tier?.toUpperCase() || "GRASSROOT"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Upcoming Sessions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockSessions.map((session) => {
              const canAccess = canAccessSession(currentUser.tier || "grassroot", session.tier_access)
              const isAvailable = session.current_participants < session.max_participants

              return (
                <Card key={session.id} className={`bg-black/20 border-gray-700 ${!canAccess ? "opacity-60" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTierIcon(session.tier_access)}
                        <Badge className={`${getTierColor(session.tier_access)} text-white text-xs`}>
                          {session.tier_access.toUpperCase()} ONLY
                        </Badge>
                      </div>
                      <Badge variant={session.status === "scheduled" ? "default" : "secondary"}>
                        {session.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardTitle className="text-white">{session.title}</CardTitle>
                    <CardDescription className="text-gray-300">{session.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Host Info */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.host.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback>{session.host.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{session.host.username}</p>
                        <p className="text-xs text-gray-400">Host</p>
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(session.scheduled_start).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(session.scheduled_start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -
                          {new Date(session.scheduled_end).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {session.current_participants}/{session.max_participants} participants
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      {!canAccess ? (
                        <Button disabled className="w-full">
                          <Crown className="mr-2 h-4 w-4" />
                          Upgrade Tier Required
                        </Button>
                      ) : !isAvailable ? (
                        <Button disabled className="w-full">
                          <Users className="mr-2 h-4 w-4" />
                          Session Full
                        </Button>
                      ) : (
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          <Video className="mr-2 h-4 w-4" />
                          Join Session
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tier Benefits */}
          <div className="mt-12">
            <Card className="bg-black/20 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-center">Meet & Greet Tier Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Star className="h-8 w-8 text-green-500" />
                    </div>
                    <h4 className="font-semibold text-white">Grassroot</h4>
                    <p className="text-sm text-gray-300">Group sessions (50+ people)</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Zap className="h-8 w-8 text-blue-500" />
                    </div>
                    <h4 className="font-semibold text-white">Pioneer</h4>
                    <p className="text-sm text-gray-300">Medium groups (20-30 people)</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Crown className="h-8 w-8 text-purple-500" />
                    </div>
                    <h4 className="font-semibold text-white">Elder</h4>
                    <p className="text-sm text-gray-300">Small groups (10-15 people)</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Heart className="h-8 w-8 text-red-500" />
                    </div>
                    <h4 className="font-semibold text-white">Blood</h4>
                    <p className="text-sm text-gray-300">Exclusive 1-on-1 or tiny groups (2-5 people)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
