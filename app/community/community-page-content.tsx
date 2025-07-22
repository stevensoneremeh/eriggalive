"use client"

import { useAuth } from "@/contexts/auth-context"
import { CommunityFeed } from "@/components/community/community-feed-final"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, TrendingUp, Star } from "lucide-react"
import Link from "next/link"

export function CommunityPageContent() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Community Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          EriggaLive Community
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with fellow fans, share your thoughts, and stay updated with the latest from the Erigga movement.
        </p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,543</div>
            <p className="text-xs text-muted-foreground">+180 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+23 today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trending Topics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Hot discussions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Contributors</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Active contributors</p>
          </CardContent>
        </Card>
      </div>

      {/* Authentication Check */}
      {!user ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Join the Community</CardTitle>
            <CardDescription>
              Sign up or log in to participate in discussions, vote on posts, and connect with other fans.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center space-x-4">
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </div>
            <div className="flex justify-center space-x-2">
              <Badge variant="secondary">Free to Join</Badge>
              <Badge variant="secondary">Instant Access</Badge>
              <Badge variant="secondary">Connect with Fans</Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Welcome Message for Authenticated Users */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Welcome back, {profile.display_name || profile.username}!</span>
                  <Badge
                    variant="secondary"
                    className={`
                      ${profile.subscription_tier === "blood" ? "bg-red-500" : ""}
                      ${profile.subscription_tier === "elder" ? "bg-purple-500" : ""}
                      ${profile.subscription_tier === "pioneer" ? "bg-blue-500" : ""}
                      ${profile.subscription_tier === "grassroot" ? "bg-green-500" : ""}
                      ${profile.subscription_tier === "general" ? "bg-gray-500" : ""}
                    `}
                  >
                    {profile.subscription_tier?.charAt(0).toUpperCase() + profile.subscription_tier?.slice(1)} Member
                  </Badge>
                </CardTitle>
                <CardDescription>
                  You have {profile.coins_balance || 0} coins available for voting and interactions.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Community Feed */}
          <CommunityFeed />
        </>
      )}
    </div>
  )
}
