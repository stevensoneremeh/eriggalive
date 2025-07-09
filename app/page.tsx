"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Users, Music, MessageSquare, Coins, Star, TrendingUp, Heart } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

const features = [
  {
    icon: Music,
    title: "Exclusive Music",
    description: "Access unreleased tracks, behind-the-scenes content, and exclusive performances.",
  },
  {
    icon: Users,
    title: "Fan Community",
    description: "Connect with fellow fans, share your thoughts, and participate in discussions.",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with other fans in real-time and join tier-based exclusive rooms.",
  },
  {
    icon: Coins,
    title: "Erigga Coins",
    description: "Earn and spend coins to unlock premium content and support your favorite artist.",
  },
]

const tiers = [
  {
    name: "Grassroot",
    price: "Free",
    color: "bg-green-500",
    features: ["Basic community access", "General chat", "1000 welcome coins"],
  },
  {
    name: "Pioneer",
    price: "$9.99/month",
    color: "bg-blue-500",
    features: ["Pioneer chat room", "Early music access", "Monthly coin bonus", "Exclusive content"],
  },
  {
    name: "Elder",
    price: "$19.99/month",
    color: "bg-yellow-500",
    features: ["Elder chat room", "VIP content access", "Higher coin rewards", "Direct artist interaction"],
  },
  {
    name: "Blood Brotherhood",
    price: "$49.99/month",
    color: "bg-orange-500",
    features: ["Blood Brotherhood room", "Unreleased tracks", "Video calls with artist", "Merchandise discounts"],
  },
]

const stats = [
  { label: "Active Fans", value: "12.5K", icon: Users },
  { label: "Tracks Shared", value: "500+", icon: Music },
  { label: "Community Posts", value: "25K", icon: MessageSquare },
  { label: "Coins Earned", value: "2.1M", icon: Coins },
]

export default function HomePage() {
  const { isAuthenticated, profile } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">Official Fan Platform</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Erigga Live
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
              Join the ultimate fan experience. Connect with fellow fans, access exclusive content, and support your
              favorite artist in the official Erigga community.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="bg-gradient-to-r from-orange-500 to-red-500">
                    <Link href="/dashboard">
                      <Play className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/community">
                      <Users className="mr-2 h-5 w-5" />
                      Join Community
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="bg-gradient-to-r from-orange-500 to-red-500">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-white/10 backdrop-blur border-white/20 text-center">
                <CardContent className="p-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need as an Erigga fan
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              From exclusive music to community features, we've got everything to enhance your fan experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-orange-400 mb-2" />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Choose Your Tier</h2>
            <p className="mt-4 text-lg text-gray-300">
              Unlock exclusive content and features based on your membership level.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`bg-white/10 backdrop-blur border-white/20 relative ${
                  profile?.tier === tier.name.toLowerCase() ? "ring-2 ring-orange-500" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{tier.name}</CardTitle>
                    <Badge className={`${tier.color} text-white`}>
                      {profile?.tier === tier.name.toLowerCase() ? "Current" : "Available"}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-white">{tier.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-gray-300">
                        <Star className="h-4 w-4 text-orange-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant={profile?.tier === tier.name.toLowerCase() ? "secondary" : "default"}
                    disabled={profile?.tier === tier.name.toLowerCase()}
                  >
                    {profile?.tier === tier.name.toLowerCase() ? "Current Tier" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to join the community?</h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Connect with thousands of Erigga fans, access exclusive content, and be part of something special.
              </p>
              {!isAuthenticated && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="bg-gradient-to-r from-orange-500 to-red-500">
                    <Link href="/signup">
                      <Heart className="mr-2 h-5 w-5" />
                      Join Now
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/community">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Explore Community
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
