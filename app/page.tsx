"use client"

import { SafeHeroVideoCarousel } from "@/components/safe-hero-video-carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Users, Calendar, Crown, Coins, Video, Radio } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { isAuthenticated, profile } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <SafeHeroVideoCarousel />

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience Erigga Like Never Before</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join the ultimate fan community with exclusive content, live events, and direct access to Erigga
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Community Feature */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Fan Community</CardTitle>
                <CardDescription>
                  Connect with thousands of Erigga fans worldwide. Share your thoughts, discuss music, and be part of
                  the movement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/community">
                  <Button className="w-full group-hover:bg-orange-600 transition-colors">Join Community</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Exclusive Content */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Music className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Media Vault</CardTitle>
                <CardDescription>
                  Access exclusive tracks, behind-the-scenes content, and unreleased music available only to community
                  members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/vault">
                  <Button
                    variant="outline"
                    className="w-full group-hover:border-purple-600 group-hover:text-purple-600 transition-colors bg-transparent"
                  >
                    Explore Vault
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Live Events */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Live Events</CardTitle>
                <CardDescription>
                  Get priority access to concerts, virtual meet & greets, and exclusive live performances.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tickets">
                  <Button
                    variant="outline"
                    className="w-full group-hover:border-green-600 group-hover:text-green-600 transition-colors bg-transparent"
                  >
                    View Events
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Radio */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Radio className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Erigga Radio</CardTitle>
                <CardDescription>
                  Listen to curated playlists, exclusive mixes, and live radio shows featuring Erigga's music 24/7.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/radio">
                  <Button
                    variant="outline"
                    className="w-full group-hover:border-red-600 group-hover:text-red-600 transition-colors bg-transparent"
                  >
                    Listen Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Meet & Greet */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Meet & Greet</CardTitle>
                <CardDescription>
                  Book exclusive one-on-one video calls with Erigga. Limited slots available for premium members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/meet-greet">
                  <Button
                    variant="outline"
                    className="w-full group-hover:border-blue-600 group-hover:text-blue-600 transition-colors bg-transparent"
                  >
                    Book Session
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Erigga Coins */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Coins className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle>Erigga Coins</CardTitle>
                <CardDescription>
                  Earn and spend Erigga Coins for exclusive merchandise, premium content, and special experiences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/coins">
                  <Button
                    variant="outline"
                    className="w-full group-hover:border-yellow-600 group-hover:text-yellow-600 transition-colors bg-transparent"
                  >
                    Get Coins
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Active Fans</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">200+</div>
              <div className="text-sm text-muted-foreground">Exclusive Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">100+</div>
              <div className="text-sm text-muted-foreground">Live Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Radio Stream</div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Experience</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Different membership tiers offer unique benefits and exclusive access
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Grassroot */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary">Grassroot</Badge>
                  <div className="text-2xl font-bold">Free</div>
                </div>
                <CardTitle>Basic Access</CardTitle>
                <CardDescription>Perfect for new fans getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Community access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Basic radio streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Limited vault access</span>
                </div>
                {!isAuthenticated && (
                  <Link href="/signup">
                    <Button className="w-full mt-6">Get Started</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Pioneer */}
            <Card className="relative border-orange-200 dark:border-orange-800">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-orange-600 text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  >
                    Pioneer
                  </Badge>
                  <div className="text-2xl font-bold">₦5,000/mo</div>
                </div>
                <CardTitle>Premium Experience</CardTitle>
                <CardDescription>Enhanced access with exclusive benefits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Everything in Grassroot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Full vault access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Priority event booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Monthly Erigga Coins</span>
                </div>
                <Link href="/premium">
                  <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700">Upgrade Now</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Elder */}
            <Card className="relative border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Elder
                  </Badge>
                  <div className="text-2xl font-bold">₦15,000/mo</div>
                </div>
                <CardTitle>VIP Treatment</CardTitle>
                <CardDescription>Ultimate fan experience with exclusive perks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Everything in Pioneer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Meet & greet access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Exclusive merchandise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Direct artist interaction</span>
                </div>
                <Link href="/premium">
                  <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">Go VIP</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join the Movement?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Become part of the official Erigga fan community and unlock exclusive content, events, and experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                    Join Free Today
                  </Button>
                </Link>
                <Link href="/premium">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-orange-600 bg-transparent"
                  >
                    Explore Premium
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/community">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-orange-600 bg-transparent"
                  >
                    Join Community
                  </Button>
                </Link>
              </>
            )}
          </div>
          {isAuthenticated && profile && (
            <div className="mt-6 text-sm opacity-75">
              Welcome back, {profile.username}! You have {profile.coins_balance} Erigga Coins
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
