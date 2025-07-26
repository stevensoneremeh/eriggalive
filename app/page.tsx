"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SafeHeroVideoCarousel } from "@/components/safe-hero-video-carousel"
import { useAuth } from "@/contexts/auth-context"
import { Users, Radio, Calendar, ShoppingBag, Coins, Star, Play, MessageCircle, Heart, Zap } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Community",
    description: "Connect with fellow Erigga fans, share content, and engage in discussions.",
    href: "/community",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Radio,
    title: "Erigga Radio",
    description: "Listen to 24/7 Erigga hits and discover new tracks from the Paper Boi himself.",
    href: "/radio",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Calendar,
    title: "Meet & Greet",
    description: "Book exclusive video calls and meet-and-greet sessions with Erigga.",
    href: "/meet-greet",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: ShoppingBag,
    title: "Merch Store",
    description: "Get exclusive Erigga merchandise and limited edition items.",
    href: "/merch",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Coins,
    title: "Erigga Coins",
    description: "Earn and spend coins for exclusive content and experiences.",
    href: "/coins",
    color: "from-yellow-500 to-amber-500",
  },
]

const stats = [
  { label: "Active Fans", value: "50K+", icon: Users },
  { label: "Songs Played", value: "1M+", icon: Play },
  { label: "Community Posts", value: "25K+", icon: MessageCircle },
  { label: "Fan Interactions", value: "100K+", icon: Heart },
]

export default function HomePage() {
  const { user, profile } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <SafeHeroVideoCarousel />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="container text-center text-white space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <Zap className="w-3 h-3 mr-1" />
                Official Fan Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Erigga Live
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
                The ultimate destination for Erigga fans. Connect, discover, and experience exclusive content from the
                Paper Boi himself.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/community">
                      <Users className="w-5 h-5 mr-2" />
                      Join Community
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                  >
                    <Link href="/radio">
                      <Radio className="w-5 h-5 mr-2" />
                      Listen Now
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/signup">
                      <Star className="w-5 h-5 mr-2" />
                      Join Now
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center space-y-2">
                  <Icon className="w-8 h-8 mx-auto text-green-600" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything You Need as an{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Erigga Fan
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From exclusive content to direct interactions, discover all the ways to connect with Erigga and the
              community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/50"
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                      <Link href={feature.href}>Explore {feature.title}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* User Welcome Section */}
      {user && profile && (
        <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="container text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Welcome back, {profile.full_name || profile.username}!</h2>
            <p className="text-xl mb-8 opacity-90">
              You're a {profile.tier} member with {profile.coins} coins
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white text-white hover:bg-white hover:text-green-600 bg-transparent"
              >
                <Link href="/community">Join Discussion</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="container text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join the Erigga Family?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Get exclusive access to content, connect with fans worldwide, and be part of the Paper Boi's journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">
                  <Star className="w-5 h-5 mr-2" />
                  Sign Up Free
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white text-white hover:bg-white hover:text-green-600 bg-transparent"
              >
                <Link href="/login">Already a fan? Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
