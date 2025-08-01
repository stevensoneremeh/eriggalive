"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Users, Music, Heart, Star, Zap, Crown, ArrowRight, Play, Volume2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function MissionPage() {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const missions = [
    {
      icon: Music,
      title: "SPREAD THE SOUND",
      description: "Share Erigga's music with the world and grow the movement",
      reward: "500 Coins",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: "BUILD THE COMMUNITY",
      description: "Connect with fellow fans and create lasting bonds",
      reward: "300 Coins",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Heart,
      title: "SHOW LOVE",
      description: "Support Erigga's journey and celebrate his achievements",
      reward: "200 Coins",
      color: "from-red-500 to-orange-500",
    },
    {
      icon: Star,
      title: "BE THE VOICE",
      description: "Represent the Warri spirit wherever you go",
      reward: "400 Coins",
      color: "from-yellow-500 to-green-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="mb-8">
            <Badge className="bg-lime-500 text-black font-bold px-4 py-2 text-lg mb-4 animate-bounce">
              🎯 THE MISSION
            </Badge>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-lime-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
            ERIGGA
          </h1>

          <div className="text-4xl md:text-6xl font-bold mb-8 transform rotate-1">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">CONTINUA</span>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            From the streets of <span className="text-lime-400 font-bold">WARRI</span> to the world stage - we're
            building something bigger than music. We're building a{" "}
            <span className="text-purple-400 font-bold">MOVEMENT</span>.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center bg-black/50 rounded-full px-6 py-3 border border-lime-500/30">
              <Volume2 className="w-5 h-5 text-lime-400 mr-2" />
              <span className="text-lime-400 font-semibold">STREET CERTIFIED</span>
            </div>
            <div className="flex items-center bg-black/50 rounded-full px-6 py-3 border border-purple-500/30">
              <Crown className="w-5 h-5 text-purple-400 mr-2" />
              <span className="text-purple-400 font-semibold">WARRI ROYALTY</span>
            </div>
            <div className="flex items-center bg-black/50 rounded-full px-6 py-3 border border-blue-500/30">
              <Zap className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-400 font-semibold">ENERGY UNLIMITED</span>
            </div>
          </div>
        </div>

        {/* Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {missions.map((mission, index) => (
            <Card
              key={index}
              className={`bg-black/40 border-gray-700 hover:border-lime-500/50 transition-all duration-500 transform hover:scale-105 hover:rotate-1 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <CardContent className="p-8">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-r ${mission.color} flex items-center justify-center mb-6 animate-pulse`}
                >
                  <mission.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-4 text-lime-400">{mission.title}</h3>

                <p className="text-gray-300 text-lg mb-6 leading-relaxed">{mission.description}</p>

                <div className="flex items-center justify-between">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-4 py-2">
                    🪙 {mission.reward}
                  </Badge>
                  <Target className="w-6 h-6 text-lime-400 animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div
          className={`text-center transition-all duration-1000 delay-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="bg-gradient-to-r from-lime-500/20 to-purple-500/20 rounded-3xl p-12 border border-lime-500/30 backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-lime-400 to-purple-400 bg-clip-text text-transparent">
              READY TO JOIN THE MOVEMENT?
            </h2>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Every legend starts with a single step. Your journey from the streets to stardom begins here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-black font-bold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300"
                >
                  <Link href="/dashboard">
                    <Play className="w-5 h-5 mr-2" />
                    CONTINUE MISSION
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-black font-bold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/signup">
                      <Zap className="w-5 h-5 mr-2" />
                      START YOUR JOURNEY
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-lime-500 text-lime-400 hover:bg-lime-500 hover:text-black font-bold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300 bg-transparent"
                  >
                    <Link href="/login">
                      <Users className="w-5 h-5 mr-2" />
                      ALREADY A MEMBER?
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 text-sm text-gray-400">
              <p>Join thousands of fans worldwide in the Erigga Live community</p>
            </div>
          </div>
        </div>

        {/* Street Credibility Section */}
        <div
          className={`mt-16 text-center transition-all duration-1000 delay-1500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-lime-400 mb-2">10K+</div>
              <p className="text-gray-300">Active Fans</p>
            </div>
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-purple-400 mb-2">50+</div>
              <p className="text-gray-300">Hit Tracks</p>
            </div>
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
              <p className="text-gray-300">Street Certified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
