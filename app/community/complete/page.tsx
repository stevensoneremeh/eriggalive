"use client"

import { Suspense } from "react"
import { CommunityLayout } from "@/components/community/community-layout"
import { CreatePostFormSimple } from "@/components/community/create-post-form-simple"
import { CompletePostCard } from "@/components/community/complete-post-card"
import { HashtagTrending } from "@/components/community/hashtag-trending"
import { SimpleNotificationBell } from "@/components/community/simple-notification-bell"
import { CommunityLeaderboards } from "@/components/community/leaderboards"
import { ChallengesContests } from "@/components/community/challenges-contests"
import { UserProfilePage } from "@/components/community/user-profile-page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Home, Trophy, Target, User, TrendingUp, MessageSquare, Users, Award, Flame, Star, Crown } from "lucide-react"

// This is the COMPLETE community experience
export default function CompleteCommunityPage() {
  const { user, profile } = useAuth()

  return (
    <CommunityLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Community Hub
              </h1>
              <p className="text-xl text-muted-foreground">Connect, compete, and create with the Erigga community</p>
            </div>
            <div className="flex items-center gap-4">
              <SimpleNotificationBell />
              {user && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  {profile?.tier || "Member"}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {user && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="font-bold">{profile?.total_posts || 0}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="font-bold">{profile?.followers_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <div className="font-bold">{profile?.reputation_score || 0}</div>
                  <div className="text-xs text-muted-foreground">Reputation</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="font-bold">0</div>
                  <div className="text-xs text-muted-foreground">Achievements</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboards
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-3 space-y-6">
                {user && (
                  <CreatePostFormSimple
                    categories={[
                      { id: 1, name: "General", slug: "general" },
                      { id: 2, name: "Bars", slug: "bars" },
                      { id: 3, name: "Music", slug: "music" },
                      { id: 4, name: "Events", slug: "events" },
                    ]}
                  />
                )}

                {/* Demo Posts */}
                <Suspense fallback={<div>Loading posts...</div>}>
                  <div className="space-y-6">
                    <CompletePostCard
                      post={{
                        id: 1,
                        content:
                          "Just dropped some fire bars! 🔥 What do you think about this new track? #NewMusic #Bars #EriggaLive",
                        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        vote_count: 25,
                        comment_count: 8,
                        view_count: 156,
                        reaction_count: 12,
                        is_trending: true,
                        user: {
                          id: 1,
                          auth_user_id: "demo-1",
                          username: "erigga_official",
                          full_name: "Erigga",
                          avatar_url: "/placeholder-user.jpg",
                          tier: "blood",
                        },
                        category: {
                          name: "Music",
                          slug: "music",
                        },
                        reactions: { fire: 8, love: 4 },
                      }}
                    />

                    <CompletePostCard
                      post={{
                        id: 2,
                        content:
                          "Community challenge update! 💪 Already seeing some amazing submissions. Keep them coming! @everyone #CommunityChallenge",
                        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                        vote_count: 18,
                        comment_count: 12,
                        view_count: 89,
                        reaction_count: 6,
                        user: {
                          id: 2,
                          auth_user_id: "demo-2",
                          username: "community_mod",
                          full_name: "Community Moderator",
                          avatar_url: "/placeholder-user.jpg",
                          tier: "elder",
                        },
                        category: {
                          name: "General",
                          slug: "general",
                        },
                        reactions: { love: 4, wow: 2 },
                      }}
                    />
                  </div>
                </Suspense>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <HashtagTrending />

                {/* Quick Actions */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold mb-3">Quick Actions</h3>
                    <Button variant="outline" className="w-full justify-start">
                      <Flame className="h-4 w-4 mr-2" />
                      Join Challenge
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Trophy className="h-4 w-4 mr-2" />
                      View Leaderboard
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Find Friends
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboards">
            <CommunityLeaderboards />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesContests />
          </TabsContent>

          <TabsContent value="trending">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Trending Content</h3>
                    <p className="text-muted-foreground">Discover what's hot in the community right now!</p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <HashtagTrending />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            {user ? (
              <UserProfilePage username={profile?.username || ""} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Login Required</h3>
                  <p className="text-muted-foreground">Please login to view your profile.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CommunityLayout>
  )
}
