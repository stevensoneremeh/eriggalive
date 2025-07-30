"use client"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  MessageCircle,
  Coins,
  Crown,
  Music,
  Radio,
  Target,
  BookOpen,
  Vault,
  Ticket,
  ShoppingBag,
  TrendingUp,
  Star,
  Play,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Community",
    description: "Connect with fellow Erigga fans worldwide",
    href: "/community",
    color: "text-blue-500",
  },
  {
    icon: MessageCircle,
    title: "Chat Rooms",
    description: "Join tier-based discussions and general chat",
    href: "/chat",
    color: "text-green-500",
  },
  {
    icon: Radio,
    title: "Erigga Radio",
    description: "Listen to exclusive tracks and live sessions",
    href: "/radio",
    color: "text-purple-500",
  },
  {
    icon: Vault,
    title: "Media Vault",
    description: "Access exclusive content and unreleased tracks",
    href: "/vault",
    color: "text-orange-500",
  },
  {
    icon: Crown,
    title: "Premium Tiers",
    description: "Unlock exclusive benefits and content",
    href: "/premium",
    color: "text-yellow-500",
  },
  {
    icon: Coins,
    title: "Erigga Coins",
    description: "Earn and spend coins in the ecosystem",
    href: "/coins",
    color: "text-amber-500",
  },
]

const stats = [
  { label: "Active Members", value: "25K+", icon: Users },
  { label: "Songs Streamed", value: "1M+", icon: Music },
  { label: "Live Sessions", value: "150+", icon: Radio },
  { label: "Community Posts", value: "5K+", icon: MessageCircle },
]

export default function HomePage() {
  const { isAuthenticated, profile, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              Official Fan Community
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Erigga Live
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The ultimate destination for Erigga fans. Connect, discover, and experience exclusive content from your
              favorite artist.
            </p>
          </div>

          {!isAuthenticated && !isLoading && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild>
                <Link href="/signup">
                  <Star className="mr-2 h-5 w-5" />
                  Join the Community
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          )}

          {isAuthenticated && profile && (
            <div className="mb-12">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Welcome back, {profile.display_name}!</h3>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Badge variant="secondary">{profile.subscription_tier}</Badge>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{profile.coins_balance}</span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore the Platform</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover all the amazing features that make Erigga Live the ultimate fan experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{feature.description}</CardDescription>
                    <Button
                      variant="outline"
                      asChild
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground bg-transparent"
                    >
                      <Link href={feature.href}>
                        Explore
                        <TrendingUp className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Access</h2>
            <p className="text-xl text-muted-foreground">Jump right into the action</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/mission">
                <Target className="h-6 w-6" />
                Mission
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/chronicles">
                <BookOpen className="h-6 w-6" />
                Chronicles
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/tickets">
                <Ticket className="h-6 w-6" />
                Tickets
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/merch">
                <ShoppingBag className="h-6 w-6" />
                Merch
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && !isLoading && (
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Become part of the Erigga Live community and unlock exclusive content, connect with fans, and
                  experience music like never before.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/signup">
                      <Play className="mr-2 h-5 w-5" />
                      Get Started Free
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/community">Browse Community</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  )
}
