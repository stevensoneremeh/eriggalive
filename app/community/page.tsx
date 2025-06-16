"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  TrendingUp,
  Music,
  Calendar,
  Coins,
  Users,
  MessageSquare,
  Plus,
  FlameIcon as Fire,
  Trophy,
  Star,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { SocialFeed } from "@/components/community/social-feed"
import { BarsSection } from "@/components/community/bars-section"
import { UserLeaderboard } from "@/components/community/user-leaderboard"
import { CreatePostDialog } from "@/components/community/create-post-dialog"
import { CommunityStats } from "@/components/community/community-stats"
import { TrendingTopics } from "@/components/community/trending-topics"
import { useToast } from "@/components/ui/use-toast"
import { TopBarsOfWeek } from "@/components/community/top-bars"

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("recent")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [communityStats, setCommunityStats] = useState({
    totalPosts: 0,
    totalBars: 0,
    activeUsers: 0,
    totalCoinsSpent: 0,
  })

  const { profile, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Fetch community stats
  useEffect(() => {
    const fetchStats = async () => {
      // Mock data for preview - replace with real API call
      setCommunityStats({
        totalPosts: 1247,
        totalBars: 389,
        activeUsers: 2156,
        totalCoinsSpent: 45230,
      })
    }
    fetchStats()
  }, [refreshKey])

  const handleCreatePost = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a post",
        variant: "destructive",
      })
      return
    }
    setIsCreatePostOpen(true)
  }, [isAuthenticated, toast])

  const handlePostCreated = useCallback(() => {
    // Refresh the feed when a new post is created
    setRefreshKey((prev) => prev + 1)
    toast({
      title: "Success!",
      description: "Your content has been shared with the community",
    })
  }, [toast])

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    toast({
      title: "Refreshed",
      description: "Community content has been updated",
    })
  }, [toast])

  const tabConfig = [
    {
      id: "all",
      label: "All Posts",
      icon: <Users className="h-4 w-4" />,
      description: "Latest posts from the community",
    },
    {
      id: "bars",
      label: "Bars",
      icon: <Music className="h-4 w-4" />,
      description: "Fan-submitted lyrics and audio bars",
    },
    {
      id: "stories",
      label: "Stories",
      icon: <MessageSquare className="h-4 w-4" />,
      description: "Fan stories and experiences",
    },
    {
      id: "events",
      label: "Events",
      icon: <Calendar className="h-4 w-4" />,
      description: "Upcoming events and meetups",
    },
  ]

  const filterOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "popular", label: "Most Popular" },
    { value: "trending", label: "Trending" },
    { value: "coins", label: "Most Coins" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500/10 via-lime-500/10 to-teal-500/10 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-8 lg:py-12 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-orange-500 via-lime-500 to-teal-500 bg-clip-text text-transparent mb-4">
              Erigga Community
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Connect with fellow fans, share your bars, and be part of the Erigga movement
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <CommunityStats stats={communityStats} />
            </div>
          </div>

          {/* Search and Create Post */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search community posts, bars, and more..."
                  className="pl-10 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" onClick={handleRefresh} className="flex-1 sm:flex-none">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={handleCreatePost}
                  size="lg"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Feed */}
          <div className="flex-1 order-2 lg:order-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Enhanced Tab Navigation */}
              <div className="bg-card rounded-lg border p-1 mb-6 overflow-x-auto">
                <TabsList className="w-full bg-transparent h-auto p-0 gap-1">
                  {tabConfig.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex-1 min-w-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-lime-500/20 data-[state=active]:text-foreground data-[state=active]:border-orange-500/50 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {tab.icon}
                        <span className="truncate">{tab.label}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Filter Bar */}
              <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                  <div className="flex gap-2">
                    {filterOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filterType === option.value ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilterType(option.value)}
                        className={
                          filterType === option.value ? "bg-gradient-to-r from-orange-500 to-lime-500 text-white" : ""
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Badge variant="secondary" className="hidden sm:flex">
                  {activeTab === "all" ? "All Posts" : tabConfig.find((t) => t.id === activeTab)?.label}
                </Badge>
              </div>

              {/* Tab Content */}
              <TabsContent value="all" className="mt-0">
                <SocialFeed key={`all-${refreshKey}`} searchQuery={searchQuery} filterType={filterType} />
              </TabsContent>

              <TabsContent value="bars" className="mt-0">
                <BarsSection key={`bars-${refreshKey}`} searchQuery={searchQuery} filterType={filterType} />
              </TabsContent>

              <TabsContent value="stories" className="mt-0">
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Stories Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We're working on bringing you amazing fan stories and experiences. Stay tuned!
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="events" className="mt-0">
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Events Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Stay tuned for upcoming events, concerts, and fan meetups!
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* User Profile Card */}
              {isAuthenticated && profile && (
                <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-orange-500/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center text-white font-bold text-lg">
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{profile.full_name || profile.username}</p>
                      <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{profile.coins?.toLocaleString() || 0}</span>
                      <span className="text-sm text-muted-foreground">coins</span>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-orange-500/20 to-lime-500/20">
                      {profile.tier || "Grassroot"}
                    </Badge>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
                    onClick={() => (window.location.href = "/coins")}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Buy More Coins
                  </Button>
                </Card>
              )}

              {/* Top Bars of the Week */}
              <Card className="overflow-hidden border-orange-500/20">
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-lime-500/10 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-orange-500" />
                      Top Bars This Week
                    </h3>
                    <Badge variant="secondary" className="bg-gradient-to-r from-orange-500/20 to-lime-500/20">
                      <Fire className="h-3 w-3 mr-1" />
                      Hot
                    </Badge>
                  </div>
                </div>
                <TopBarsOfWeek key={`top-bars-${refreshKey}`} />
              </Card>

              {/* User Leaderboard */}
              <Card className="overflow-hidden border-lime-500/20">
                <div className="p-4 bg-gradient-to-r from-lime-500/10 to-teal-500/10 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-lime-500" />
                    Community Leaders
                  </h3>
                </div>
                <UserLeaderboard key={`leaderboard-${refreshKey}`} />
              </Card>

              {/* Trending Topics */}
              <Card className="overflow-hidden border-teal-500/20">
                <div className="p-4 bg-gradient-to-r from-teal-500/10 to-blue-500/10 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-500" />
                    Trending Topics
                  </h3>
                </div>
                <TrendingTopics key={`trending-${refreshKey}`} />
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={isCreatePostOpen}
        onOpenChange={setIsCreatePostOpen}
        defaultTab={activeTab}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}
