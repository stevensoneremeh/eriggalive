"use client"

import { useAuth } from "@/contexts/auth-context"
import { FreebiesFeed } from "@/components/freebies/freebies-feed"
import { CreateFreebiesPost } from "@/components/freebies/create-freebies-post"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Users, TrendingUp, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function FreebiesPage() {
  const { isAuthenticated, isLoading, profile } = useAuth()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Join the Freebies Community
            </CardTitle>
            <CardDescription>
              Sign in to share and discover freebies, giveaways, and exclusive offers from the Erigga community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <div className="text-sm font-medium">Community</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <div className="text-sm font-medium">Trending</div>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Sign In to Continue</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Freebies & Giveaways</h1>
            <p className="text-muted-foreground">Share and discover exclusive offers from the community</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">2.5K</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-muted-foreground">Active Offers</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">892</div>
                  <div className="text-sm text-muted-foreground">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post */}
      <div className="mb-8">
        <CreateFreebiesPost />
      </div>

      {/* Feed */}
      <FreebiesFeed />
    </div>
  )
}
