"use client"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HeroVideo } from "@/components/hero-video"
import { Users, Vault, Radio, Calendar, ShoppingBag, Coins, Star } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Community",
    description: "Connect with fellow fans, share content, and engage in discussions",
    href: "/community",
    color: "text-blue-500",
  },
  {
    icon: Vault,
    title: "Media Vault",
    description: "Access exclusive music, videos, and behind-the-scenes content",
    href: "/vault",
    color: "text-purple-500",
  },
  {
    icon: Radio,
    title: "Erigga Radio",
    description: "Listen to curated playlists and live radio shows",
    href: "/radio",
    color: "text-green-500",
  },
  {
    icon: Calendar,
    title: "Meet & Greet",
    description: "Book personal video calls and meet-and-greet sessions",
    href: "/meet-greet",
    color: "text-red-500",
  },
  {
    icon: ShoppingBag,
    title: "Merch Store",
    description: "Shop exclusive merchandise and limited edition items",
    href: "/merch",
    color: "text-orange-500",
  },
  {
    icon: Coins,
    title: "Erigga Coins",
    description: "Earn and spend coins for exclusive perks and content",
    href: "/coins",
    color: "text-yellow-500",
  },
]

const tiers = [
  {
    name: "Grassroot",
    description: "Basic access to community features",
    features: ["Community access", "Basic content", "General chat"],
    color: "bg-green-100 text-green-800",
  },
  {
    name: "Pioneer",
    description: "Enhanced features and exclusive content",
    features: ["All Grassroot features", "Exclusive content", "Priority support"],
    color: "bg-blue-100 text-blue-800",
  },
  {
    name: "Elder",
    description: "Premium access with special privileges",
    features: ["All Pioneer features", "Meet & greet access", "Exclusive events"],
    color: "bg-purple-100 text-purple-800",
  },
  {
    name: "Blood",
    description: "Ultimate fan experience with all features",
    features: ["All Elder features", "Direct access", "VIP treatment"],
    color: "bg-red-100 text-red-800",
  },
]

export default function HomePage() {
  const { user, profile, loading } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center">
        <HeroVideo
          src="/placeholder-video.mp4"
          poster="/images/hero/erigga1.jpeg"
          title="Welcome to Erigga Live"
          className="absolute inset-0"
        />

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">Welcome to Erigga Live</h1>
          <p className="text-xl md:text-2xl mb-8 drop-shadow-md">
            The official fan community for exclusive content, interactions, and experiences
          </p>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : user && profile ? (
            <div className="space-y-4">
              <p className="text-lg">
                Welcome back, <span className="font-semibold">{profile.username}</span>!
              </p>
              <Badge
                className={`text-sm px-3 py-1 ${
                  profile.tier === "blood"
                    ? "bg-red-500"
                    : profile.tier === "elder"
                      ? "bg-purple-500"
                      : profile.tier === "pioneer"
                        ? "bg-blue-500"
                        : "bg-green-500"
                }`}
              >
                {profile.tier.toUpperCase()} MEMBER
              </Badge>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/community">Join Community</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">Join the Community</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore the Platform</h2>
            <p className="text-xl text-muted-foreground">Discover all the amazing features available to fans</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                      <CardTitle>{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{feature.description}</CardDescription>
                    <Button variant="outline" asChild className="w-full bg-transparent">
                      <Link href={user ? feature.href : "/login"}>{user ? "Explore" : "Sign In to Access"}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Membership Tiers</h2>
            <p className="text-xl text-muted-foreground">Choose your level of access and exclusive benefits</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <Card key={tier.name} className="relative">
                <CardHeader>
                  <Badge className={`w-fit ${tier.color}`}>{tier.name}</Badge>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join the Community?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get exclusive access to content, connect with fans, and be part of the Erigga experience
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
