"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { UserTierBadge } from "@/components/user-tier-badge"
import { Crown, Coins, Calendar, Users, Music, Video, MessageCircle, Star, Trophy, Zap, Gift } from "lucide-react"

export default function EnterpriseDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalCoins: 0,
    exclusiveContent: 0,
    vipEvents: 0,
    directMessages: 0,
  })

  useEffect(() => {
    // Fetch enterprise-specific stats
    // This would be replaced with actual API calls
    setStats({
      totalCoins: 15000,
      exclusiveContent: 25,
      vipEvents: 8,
      directMessages: 12,
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-black to-yellow-900/20">
      {/* Gold accent background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                VIP Dashboard
              </h1>
              <p className="text-gray-300 mt-2">Welcome to your exclusive Enterprise experience</p>
            </div>
            <UserTierBadge tier="ENT" size="lg" />
          </div>

          {/* Gold divider */}
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full" />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Erigga Coins</CardTitle>
              <Coins className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.totalCoins.toLocaleString()}</div>
              <p className="text-xs text-gray-400">+2,000 this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Exclusive Content</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.exclusiveContent}</div>
              <p className="text-xs text-gray-400">VIP releases</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">VIP Events</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.vipEvents}</div>
              <p className="text-xs text-gray-400">This year</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Direct Access</CardTitle>
              <MessageCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.directMessages}</div>
              <p className="text-xs text-gray-400">Artist interactions</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* VIP Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Exclusive Content */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Crown className="h-5 w-5 mr-2" />
                  VIP Exclusive Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-yellow-500/10">
                  <div className="flex items-center space-x-3">
                    <Music className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Unreleased Tracks</p>
                      <p className="text-sm text-gray-400">5 new tracks available</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">New</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-yellow-500/10">
                  <div className="flex items-center space-x-3">
                    <Video className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Behind the Scenes</p>
                      <p className="text-sm text-gray-400">Studio sessions & more</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">VIP</Badge>
                </div>

                <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold">
                  Access VIP Content
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* VIP Perks */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Trophy className="h-5 w-5 mr-2" />
                  Enterprise Perks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-white">Priority support & direct line</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2">
                    <Gift className="h-4 w-4 text-yellow-400" />
                    <span className="text-white">Exclusive merchandise discounts</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2">
                    <Users className="h-4 w-4 text-yellow-400" />
                    <span className="text-white">Meet & greet opportunities</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="text-white">Early event access & VIP seating</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-sm text-yellow-200 font-medium mb-2">Next VIP Event</p>
                  <p className="text-white font-semibold">Intimate Session with THE GOAT</p>
                  <p className="text-sm text-gray-400">September 3rd, 2025 • Warri, Nigeria</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-yellow-400">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400/50 bg-transparent"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Artist
                </Button>
                <Button
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400/50 bg-transparent"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book VIP Experience
                </Button>
                <Button
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400/50 bg-transparent"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Redeem Perks
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
