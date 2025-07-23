"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Users, MessageCircle, Crown, Star, Zap, Heart } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Erigga Live
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The ultimate community hub for Erigga fans. Connect, chat, and experience exclusive content with fellow
            supporters.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              asChild
            >
              <Link href="/signup">Join the Community</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-black bg-transparent"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-6 w-6 text-blue-400" />
                <CardTitle>Live Chat Rooms</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Join tier-based chat rooms and connect with fans at your level. Real-time conversations with fellow
                supporters.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-green-400" />
                <CardTitle>Community Posts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Share your thoughts, bars, and connect with the community. Vote, comment, and engage with real-time
                updates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Music className="h-6 w-6 text-purple-400" />
                <CardTitle>Exclusive Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Access tier-exclusive content, early releases, and special features based on your membership level.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Tier System */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-6">Membership Tiers</h2>
          <p className="text-gray-300 mb-8">Choose your level of engagement and unlock exclusive features</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-b from-green-500/20 to-green-600/20 border-green-500/30 text-white">
              <CardHeader className="text-center">
                <Star className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <CardTitle>Street Rep</CardTitle>
                <Badge className="bg-green-500 text-white">Grassroot</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• General chat access</li>
                  <li>• Community posts</li>
                  <li>• Basic features</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-blue-500/20 to-blue-600/20 border-blue-500/30 text-white">
              <CardHeader className="text-center">
                <Zap className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <CardTitle>Warri Elite</CardTitle>
                <Badge className="bg-blue-500 text-white">Pioneer</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Pioneer chat room</li>
                  <li>• Exclusive content</li>
                  <li>• Priority support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-purple-500/20 to-purple-600/20 border-purple-500/30 text-white">
              <CardHeader className="text-center">
                <Crown className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <CardTitle>Erigma Circle</CardTitle>
                <Badge className="bg-purple-500 text-white">Elder</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Elder exclusive room</li>
                  <li>• VIP content access</li>
                  <li>• Direct artist interaction</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-red-500/20 to-red-600/20 border-red-500/30 text-white">
              <CardHeader className="text-center">
                <Heart className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <CardTitle>Blood Brotherhood</CardTitle>
                <Badge className="bg-red-500 text-white">Ultimate</Badge>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Ultimate tier access</li>
                  <li>• All exclusive content</li>
                  <li>• Special privileges</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 text-white max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Join?</h3>
              <p className="text-gray-300 mb-6">
                Start your journey with the Erigga community today. Connect with thousands of fans and access exclusive
                content.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600" asChild>
                  <Link href="/signup">Create Account</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-black bg-transparent"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
