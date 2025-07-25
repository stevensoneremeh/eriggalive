"use client"

import { HeroVideo } from "@/components/hero-video"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { Users, Radio, ShoppingBag, Calendar, Star, Zap, Crown, Shield } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Community",
    description: "Connect with fellow fans and share your passion",
    href: "/community",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Radio,
    title: "Erigga Radio",
    description: "Listen to exclusive tracks and live sessions",
    href: "/radio",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: ShoppingBag,
    title: "Media Vault",
    description: "Access exclusive content and merchandise",
    href: "/vault",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Meet & Greet",
    description: "Book personal sessions with Erigga",
    href: "/meet-greet",
    color: "from-orange-500 to-red-500",
  },
]

const tiers = [
  {
    name: "Grassroot",
    icon: Star,
    color: "bg-green-500",
    description: "Basic access to community features",
  },
  {
    name: "Pioneer",
    icon: Zap,
    color: "bg-blue-500",
    description: "Enhanced features and exclusive content",
  },
  {
    name: "Elder",
    icon: Crown,
    color: "bg-yellow-500",
    description: "Premium access with special privileges",
  },
  {
    name: "Blood",
    icon: Shield,
    color: "bg-red-600",
    description: "Ultimate fan experience with all features",
  },
]

export default function HomePage() {
  const { user, userProfile, loading } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen">
        <HeroVideo
          src="/videos/hero-video.mp4"
          poster="/images/hero/erigga1.jpeg"
          className="h-full"
          autoPlay
          muted
          loop
        />
      </section>

      {/* Welcome Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Welcome to the Official Erigga Community</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of fans in the ultimate destination for exclusive content, community interaction, and
              direct access to Erigga.
            </p>
          </div>

          {/* User Status */}
          {!loading && (
            <div className="text-center mb-12">
              {user ? (
                <div className="inline-flex items-center space-x-4 p-4 bg-muted rounded-lg">
                  <div className="text-left">
                    <p className="font-medium">Welcome back, {userProfile?.full_name || user.email}!</p>
                    {userProfile?.tier && (
                      <Badge
                        className={`mt-1 ${
                          userProfile.tier === "admin"
                            ? "bg-red-500"
                            : userProfile.tier === "mod"
                              ? "bg-purple-500"
                              : userProfile.tier === "elder"
                                ? "bg-yellow-500"
                                : userProfile.tier === "blood"
                                  ? "bg-red-600"
                                  : userProfile.tier === "pioneer"
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                        }`}
                      >
                        {userProfile.tier.toUpperCase()} MEMBER
                      </Badge>
                    )}
                  </div>
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground">Ready to join the community?</p>
                  <div className="flex justify-center space-x-4">
                    <Button size="lg" asChild>
                      <Link href="/signup">Sign Up Now</Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground bg-transparent"
                      asChild
                    >
                      <Link href={feature.href}>Explore {feature.title}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Membership Tiers</h2>
            <p className="text-xl text-muted-foreground">Choose your level of access and unlock exclusive benefits</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon
              return (
                <Card key={tier.name} className="text-center">
                  <CardHeader>
                    <div
                      className={`w-16 h-16 rounded-full ${tier.color} flex items-center justify-center mx-auto mb-4`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/premium">Learn More</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Join the Movement?</h2>
          <p className="text-xl mb-8 opacity-90">Be part of the most exclusive fan community in Nigerian music</p>
          {!user && (
            <div className="flex justify-center space-x-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
