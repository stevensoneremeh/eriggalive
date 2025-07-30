"use client"

import { useAuth } from "@/contexts/auth-context"
import { GeneralChat } from "@/components/chat/general-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Users, TrendingUp, Hash } from "lucide-react"
import Link from "next/link"

export default function GeneralChatPage() {
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
              <MessageCircle className="h-5 w-5" />
              Join General Chat
            </CardTitle>
            <CardDescription>
              Connect with the Erigga community in our general discussion room. Share thoughts, ask questions, and make
              new friends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <div className="text-sm font-medium">5.2K Members</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <div className="text-sm font-medium">Always Active</div>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Sign In to Chat</Link>
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
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
            <Hash className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">General Chat</h1>
            <p className="text-muted-foreground">Open discussions for all community members</p>
          </div>
        </div>

        {/* Welcome Message */}
        {profile && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {profile.display_name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <div className="font-medium">Welcome back, {profile.display_name}!</div>
                  <div className="text-sm text-muted-foreground">
                    You're chatting as a {profile.subscription_tier} member
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">127</div>
                  <div className="text-sm text-muted-foreground">Online Now</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">1.2K</div>
                  <div className="text-sm text-muted-foreground">Messages Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">5.2K</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Component */}
      <GeneralChat />
    </div>
  )
}
