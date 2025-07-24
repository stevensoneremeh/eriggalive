"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Users, MapPin, Calendar, MessageCircle, UserPlus, Grid, List, Crown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"

interface MeetGreetUser {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  tier: string
  location?: string
  bio?: string
  joined_date: string
  is_online: boolean
  last_seen?: string
}

const mockUsers: MeetGreetUser[] = [
  {
    id: "1",
    username: "EriggaOfficial",
    full_name: "Erigga Official",
    avatar_url: "/placeholder-user.jpg",
    tier: "blood_brotherhood",
    location: "Warri, Nigeria",
    bio: "The Paper Boi himself. Street motivation all day! 🔥",
    joined_date: "2020-01-01",
    is_online: true,
  },
  {
    id: "2",
    username: "WarriPikin",
    full_name: "Sarah Johnson",
    avatar_url: "/placeholder-user.jpg",
    tier: "elder",
    location: "Lagos, Nigeria",
    bio: "Erigga's biggest fan from day one! Love the street motivation 💪",
    joined_date: "2021-03-15",
    is_online: true,
  },
  {
    id: "3",
    username: "StreetKing",
    full_name: "Michael Okafor",
    avatar_url: "/placeholder-user.jpg",
    tier: "pioneer",
    location: "Abuja, Nigeria",
    bio: "Real recognize real. Erigga's music changed my life 🙏",
    joined_date: "2021-07-22",
    is_online: false,
    last_seen: "2 hours ago",
  },
  {
    id: "4",
    username: "PaperBoiFan",
    full_name: "Grace Adebayo",
    avatar_url: "/placeholder-user.jpg",
    tier: "grassroot",
    location: "Port Harcourt, Nigeria",
    bio: "New to the community but loving every moment! 🎵",
    joined_date: "2024-01-10",
    is_online: true,
  },
]

export default function MeetGreetPage() {
  const { profile, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<MeetGreetUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTier, setSelectedTier] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("newest")

  const supabase = createClient()

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Fixed Supabase query - separate the operations properly
      const query = supabase.from("users").select("*").eq("is_active", true)

      const { data: usersData, error } = await query.order("created_at", { ascending: false }).limit(50)

      if (error) {
        console.error("Error loading users:", error)
        setUsers(mockUsers)
        return
      }

      const transformedUsers =
        usersData?.map((user) => ({
          id: user.id.toString(),
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          tier: user.tier,
          location: user.location || "Nigeria",
          bio: user.bio || "Erigga fan and community member",
          joined_date: user.created_at,
          is_online: Math.random() > 0.5,
          last_seen: Math.random() > 0.7 ? "1 hour ago" : undefined,
        })) || []

      setUsers(transformedUsers.length > 0 ? transformedUsers : mockUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTier = selectedTier === "all" || user.tier === selectedTier

    return matchesSearch && matchesTier
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.joined_date).getTime() - new Date(a.joined_date).getTime()
      case "oldest":
        return new Date(a.joined_date).getTime() - new Date(b.joined_date).getTime()
      case "name":
        return a.full_name.localeCompare(b.full_name)
      case "online":
        return (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0)
      default:
        return 0
    }
  })

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Meet & Greet
          </div>
          <h1 className="text-4xl font-bold mb-4">Community Directory</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow Erigga fans from around the world. Build friendships and share the love for street
            motivation.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-2xl font-bold">{users.filter((u) => u.is_online).length}</p>
              <p className="text-sm text-muted-foreground">Online Now</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">15+</p>
              <p className="text-sm text-muted-foreground">Countries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{users.filter((u) => u.tier === "blood_brotherhood").length}</p>
              <p className="text-sm text-muted-foreground">Blood Members</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search members by name, username, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="blood_brotherhood">Blood</option>
                  <option value="elder">Elder</option>
                  <option value="pioneer">Pioneer</option>
                  <option value="grassroot">Grassroot</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="online">Online First</option>
                </select>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Directory */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading community members...</p>
          </div>
        ) : sortedUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No members found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {sortedUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className={viewMode === "grid" ? "p-6" : "p-4"}>
                  <div
                    className={`flex ${viewMode === "grid" ? "flex-col items-center text-center" : "items-center gap-4"}`}
                  >
                    <div className="relative">
                      <Avatar className={`${viewMode === "grid" ? "h-20 w-20 mb-4" : "h-16 w-16"}`}>
                        <AvatarImage src={user.avatar_url || "/placeholder-user.jpg"} alt={user.username} />
                        <AvatarFallback className="text-lg">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {user.is_online && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      {user.tier === "blood_brotherhood" && (
                        <div className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className={`${viewMode === "grid" ? "w-full" : "flex-1 min-w-0"}`}>
                      <div className={`${viewMode === "grid" ? "mb-3" : "mb-2"}`}>
                        <h3 className="font-bold text-lg">{user.full_name}</h3>
                        <p className="text-muted-foreground text-sm">@{user.username}</p>
                        <div className="flex items-center gap-2 mt-1 justify-center">
                          <Badge className={`text-xs ${getTierColor(user.tier)} text-white`}>
                            {getTierDisplayName(user.tier)}
                          </Badge>
                          {user.is_online ? (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            >
                              Online
                            </Badge>
                          ) : user.last_seen ? (
                            <Badge variant="secondary" className="text-xs">
                              {user.last_seen}
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      {user.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2 justify-center">
                          <MapPin className="h-3 w-3" />
                          {user.location}
                        </div>
                      )}

                      {user.bio && (
                        <p
                          className={`text-sm text-muted-foreground ${viewMode === "grid" ? "mb-4" : "mb-2"} line-clamp-2`}
                        >
                          {user.bio}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4 justify-center">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(user.joined_date).toLocaleDateString()}
                      </div>

                      <div className={`flex gap-2 ${viewMode === "grid" ? "justify-center" : ""}`}>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Follow
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination would go here */}
        {sortedUsers.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline">Load More Members</Button>
          </div>
        )}
      </div>
    </div>
  )
}
