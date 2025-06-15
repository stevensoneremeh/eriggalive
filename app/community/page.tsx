"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SocialFeed } from "@/components/community/social-feed"
import { BarsSection } from "@/components/community/bars-section"
import { CommunityStats } from "@/components/community/community-stats"
import { TrendingTopics } from "@/components/community/trending-topics"
import { UserLeaderboard } from "@/components/community/user-leaderboard"
import { CreatePostDialog } from "@/components/community/create-post-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { Music, Calendar, Users, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community</h1>
            <p className="text-muted-foreground">Connect with fellow Erigga fans and share your passion</p>
          </div>
          <Button onClick={() => setIsCreatePostOpen(true)} className="bg-lime-500 hover:bg-lime-600 text-teal-900">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Community Stats */}
        <CommunityStats stats={communityStats} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="feed" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="feed">Social Feed</TabsTrigger>
                <TabsTrigger value="bars">Bars & Battles</TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6">
                <SocialFeed key={`all-${refreshKey}`} searchQuery={searchQuery} filterType={filterType} />
              </TabsContent>

              <TabsContent value="bars" className="space-y-6">
                <BarsSection key={`bars-${refreshKey}`} searchQuery={searchQuery} filterType={filterType} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TrendingTopics key={`trending-${refreshKey}`} />
            <UserLeaderboard key={`leaderboard-${refreshKey}`} />
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
    </DashboardLayout>
  )
}
