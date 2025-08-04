"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Play, Users, Music, Star, ArrowRight, Calendar, MessageSquare, Crown, Coins } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { isAuthenticated, profile, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Erigga Live
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            The official fan platform for Erigga - Connect with the community, access exclusive content, and experience
            Nigerian hip-hop like never before.
          </p>

          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <Play className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/community">
                <Button size="lg" variant="outline">
                  <Users className="mr-2 h-5 w-5" />
                  Join Community
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <Star className="mr-2 h-5 w-5" />
                  Join the Community
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Exclusive Content</CardTitle>
              <CardDescription>
                Access unreleased tracks, behind-the-scenes footage, and exclusive interviews
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Community</CardTitle>
              <CardDescription>
                Connect with fellow fans, share your thoughts, and participate in discussions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mb-4">
                <Coins className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Erigga Coins</CardTitle>
              <CardDescription>
                Earn coins through engagement and use them for exclusive content and merchandise
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Live Events</CardTitle>
              <CardDescription>
                Get early access to concert tickets and exclusive meet & greet opportunities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Direct Chat</CardTitle>
              <CardDescription>
                Participate in live chats and Q&A sessions with Erigga and the community
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <Crown className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Tier System</CardTitle>
              <CardDescription>Progress through tiers to unlock exclusive benefits and premium content</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Join the Growing Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-300">Exclusive Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">Live Events</div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Join?</h3>
                <p className="mb-6 opacity-90">
                  Start your journey with Erigga Live today and become part of the culture
                </p>
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </section>
    </div>
  )
}
