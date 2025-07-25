"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Users, Star, Video, MessageCircle, Coins, Crown, Radio, Archive } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { HeroVideoCarousel } from "@/components/hero-video-carousel"
import { LayoutDashboard } from "@/components/layout-dashboard" // Declared the LayoutDashboard variable

const featuredContent = [
  {
    id: 1,
    title: "Latest Track: Paper Boi",
    description: "The hottest new release from Erigga",
    type: "music",
    thumbnail: "/images/hero/erigga1.jpeg",
    duration: "3:45",
  },
  {
    id: 2,
    title: "Behind the Scenes",
    description: "Exclusive studio footage",
    type: "video",
    thumbnail: "/images/hero/erigga2.jpeg",
    duration: "12:30",
  },
  {
    id: 3,
    title: "Live Performance",
    description: "Concert highlights from Lagos",
    type: "video",
    thumbnail: "/images/hero/erigga3.jpeg",
    duration: "8:15",
  },
]

const upcomingEvents = [
  {
    id: 1,
    title: "Meet & Greet Session",
    date: "Dec 25, 2024",
    time: "7:00 PM",
    type: "Virtual",
    price: "500 coins",
  },
  {
    id: 2,
    title: "Live Radio Show",
    date: "Dec 28, 2024",
    time: "8:00 PM",
    type: "Live Stream",
    price: "Free",
  },
  {
    id: 3,
    title: "New Year Concert",
    date: "Dec 31, 2024",
    time: "10:00 PM",
    type: "Live Event",
    price: "₦15,000",
  },
]

const communityStats = [
  { label: "Active Fans", value: "12.5K", icon: Users },
  { label: "Total Streams", value: "2.8M", icon: Play },
  { label: "Community Posts", value: "8.9K", icon: MessageCircle },
  { label: "Live Sessions", value: "156", icon: Video },
]

export default function HomePage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <HeroVideoCarousel />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              Welcome to <span className="text-orange-500">Erigga Live</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              The official community platform for Erigga fans worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Link href="/community">
                      <Users className="mr-2 h-5 w-5" />
                      Join Community
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/signup">
                      <Star className="mr-2 h-5 w-5" />
                      Join the Family
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Community Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {communityStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Featured Content */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Featured Content</h2>
            <Button variant="outline" asChild>
              <Link href="/vault">
                <Archive className="mr-2 h-4 w-4" />
                View All
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredContent.map((content) => (
              <Card key={content.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={content.thumbnail || "/placeholder.svg"}
                    alt={content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="lg" className="rounded-full">
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black/70">{content.duration}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{content.title}</CardTitle>
                  <CardDescription>{content.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Platform Features */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Explore the Platform</h2>

          <Tabs defaultValue="community" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="community">Community</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
            </TabsList>

            <TabsContent value="community" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-orange-500" />
                      Join the Community
                    </CardTitle>
                    <CardDescription>
                      Connect with fellow fans, share your thoughts, and be part of the conversation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href="/community">Explore Community</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="mr-2 h-5 w-5 text-orange-500" />
                      Live Chat
                    </CardTitle>
                    <CardDescription>Real-time conversations with fans across different tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full bg-transparent">
                      <Link href="/chat">Start Chatting</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Archive className="mr-2 h-5 w-5 text-orange-500" />
                      Media Vault
                    </CardTitle>
                    <CardDescription>Access exclusive music, videos, and behind-the-scenes content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href="/vault">Browse Vault</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Radio className="mr-2 h-5 w-5 text-orange-500" />
                      Erigga Radio
                    </CardTitle>
                    <CardDescription>24/7 music streaming with live shows and exclusive mixes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full bg-transparent">
                      <Link href="/radio">Listen Now</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Upcoming Events</h3>
                {upcomingEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {event.date} at {event.time} • {event.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{event.price}</Badge>
                        <Button size="sm" className="ml-2">
                          {event.price === "Free" ? "Join" : "Book Now"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="premium" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Crown className="mr-2 h-5 w-5 text-orange-500" />
                      Premium Access
                    </CardTitle>
                    <CardDescription>Unlock exclusive content and features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href="/premium">Upgrade Now</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Video className="mr-2 h-5 w-5 text-orange-500" />
                      Meet & Greet
                    </CardTitle>
                    <CardDescription>Personal video calls with Erigga</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full bg-transparent">
                      <Link href="/meet-greet">Book Session</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Coins className="mr-2 h-5 w-5 text-orange-500" />
                      Erigga Coins
                    </CardTitle>
                    <CardDescription>Purchase coins for exclusive experiences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full bg-transparent">
                      <Link href="/coins">Get Coins</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Call to Action */}
        {!user && (
          <section className="text-center py-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Ready to Join the Family?</h2>
                <p className="text-muted-foreground mb-6">
                  Get exclusive access to content, connect with other fans, and be part of the Erigga community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/signup">
                      <Star className="mr-2 h-5 w-5" />
                      Sign Up Now
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Already a member? Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  )
}
