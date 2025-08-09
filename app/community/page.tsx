"use client"

import { Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"
import { CommunityPageClient } from "./community-page-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MessageCircle, Crown, Coins } from 'lucide-react'
import Link from "next/link"
import { LoginPromptModal } from "@/components/auth/login-prompt-modal"
import { useAuthAction } from "@/hooks/use-auth-action"

function CommunityWelcome() {
  const { executeWithAuth, showLoginPrompt, handleLoginSuccess, handleLoginCancel } = useAuthAction()

  const handleJoinCommunity = () => {
    executeWithAuth(
      () => {
        // This will be handled by the auth success callback
        window.location.reload()
      },
      {
        title: "Join the Community",
        description: "Sign in to participate in discussions, create posts, and connect with other fans.",
        showToast: true
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Erigga Live Community
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Connect with fellow fans, share your thoughts, and be part of the conversation. 
            Join thousands of Erigga fans from around the world.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleJoinCommunity} size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Crown className="mr-2 h-5 w-5" />
              Join Community
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">
                Create Account
              </Link>
            </Button>
          </div>
        </div>

        {/* Community Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Discussions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Engage in meaningful conversations about Erigga's music, upcoming projects, and street culture.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Meet other fans, share experiences, and build lasting friendships within the community.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle>Earn Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Participate actively and earn Erigga coins that can be used for exclusive content and perks.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Community Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Community Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">10K+</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">50K+</div>
                <div className="text-sm text-muted-foreground">Posts Shared</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">100K+</div>
                <div className="text-sm text-muted-foreground">Comments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">24/7</div>
                <div className="text-sm text-muted-foreground">Active Discussions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Community Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  W
                </div>
                <div className="flex-1">
                  <p className="font-medium">WarriKing23 shared a new post</p>
                  <p className="text-sm text-muted-foreground">"Just listened to the new track, Erigga never disappoints! 🔥"</p>
                </div>
                <div className="text-xs text-muted-foreground">2h ago</div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                  L
                </div>
                <div className="flex-1">
                  <p className="font-medium">LagosHustler started a discussion</p>
                  <p className="text-sm text-muted-foreground">"What's your favorite Erigga album and why?"</p>
                </div>
                <div className="text-xs text-muted-foreground">4h ago</div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  P
                </div>
                <div className="flex-1">
                  <p className="font-medium">PaperBoi99 commented on a post</p>
                  <p className="text-sm text-muted-foreground">"The Chronicles series is pure genius! Can't wait for the next episode."</p>
                </div>
                <div className="text-xs text-muted-foreground">6h ago</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button onClick={handleJoinCommunity} variant="outline">
                Join to See More Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={handleLoginCancel}
        onSuccess={handleLoginSuccess}
        title="Join the Community"
        description="Sign in to participate in discussions, create posts, and connect with other fans."
      />
    </div>
  )
}

export default function CommunityPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      {user ? <CommunityPageClient /> : <CommunityWelcome />}
    </Suspense>
  )
}
