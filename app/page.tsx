"use client"

import { HeroVideoCarousel } from "@/components/hero-video-carousel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Music, MessageCircle, Coins, Crown, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
              🎵 Official Erigga Fan Community
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Erigga Live
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Join the ultimate fan community for Erigga. Connect with fellow fans, access exclusive content, earn
              coins, and be part of the movement that's changing Nigerian hip-hop.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg" className="px-8 py-3">
                  <Link href="/dashboard">
                    <Crown className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="px-8 py-3">
                    <Link href="/signup">
                      <Users className="w-5 h-5 mr-2" />
                      Join the Community
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Hero Video Carousel */}
          <div className="max-w-4xl mx-auto">
            <HeroVideoCarousel />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need as an Erigga Fan
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From exclusive content to community interactions, we've got everything to enhance your fan experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Community Chat</CardTitle>
                <CardDescription>
                  Connect with fellow fans in real-time chat rooms organized by subscription tiers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Exclusive Content</CardTitle>
                <CardDescription>
                  Access unreleased tracks, behind-the-scenes videos, and exclusive merchandise.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Erigga Coins</CardTitle>
                <CardDescription>
                  Earn and spend coins for exclusive perks, merchandise, and special experiences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle>VIP Experiences</CardTitle>
                <CardDescription>Meet & greet sessions, exclusive events, and direct access to Erigga.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Tier System</CardTitle>
                <CardDescription>
                  Progress through Grassroot, Pioneer, Elder, and Blood Brotherhood tiers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Live Radio</CardTitle>
                <CardDescription>
                  24/7 Erigga radio with latest tracks, interviews, and fan-submitted content.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">What Fans Are Saying</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join thousands of satisfied fans in the Erigga Live community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Being part of Erigga Live has been incredible. The exclusive content and community interactions make
                  me feel closer to the music I love."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Sarah O.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pioneer Member</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "The coin system is genius! I've earned enough to get exclusive merchandise and even attended a meet &
                  greet session."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Michael A.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Elder Member</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "This platform brings all Erigga fans together. The community discussions and exclusive content drops
                  are absolutely amazing!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Blessing I.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Blood Brotherhood</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Tier</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Start free and upgrade as you become more involved in the community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-center">Grassroot</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">Free</span>
                </div>
                <CardDescription className="text-center">Perfect for new fans getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Basic community access</li>
                  <li>✓ General chat rooms</li>
                  <li>✓ 100 welcome coins</li>
                  <li>✓ Basic profile features</li>
                </ul>
                <Button className="w-full mt-6 bg-transparent" variant="outline" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-center text-purple-600 dark:text-purple-400">Pioneer</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">₦2,500</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <CardDescription className="text-center">For dedicated fans who want more</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Everything in Grassroot</li>
                  <li>✓ Exclusive content access</li>
                  <li>✓ Pioneer chat rooms</li>
                  <li>✓ Monthly coin bonus</li>
                  <li>✓ Priority support</li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link href="/premium">Upgrade Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-center text-blue-600 dark:text-blue-400">Elder</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">₦5,000</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <CardDescription className="text-center">For true supporters of the movement</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Everything in Pioneer</li>
                  <li>✓ Elder exclusive content</li>
                  <li>✓ Meet & greet opportunities</li>
                  <li>✓ Merchandise discounts</li>
                  <li>✓ Direct artist interaction</li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link href="/premium">Upgrade Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-yellow-200 dark:border-yellow-800">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white">
                VIP
              </Badge>
              <CardHeader>
                <CardTitle className="text-center text-yellow-600 dark:text-yellow-400">Blood Brotherhood</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">₦10,000</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <CardDescription className="text-center">The ultimate fan experience</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Everything in Elder</li>
                  <li>✓ VIP exclusive content</li>
                  <li>✓ Private artist sessions</li>
                  <li>✓ Free merchandise</li>
                  <li>✓ Concert VIP access</li>
                  <li>✓ Personal artist messages</li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link href="/premium">Go VIP</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Join the Movement?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Become part of the largest Erigga fan community and experience music like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <>
                <Button asChild size="lg" className="px-8 py-3">
                  <Link href="/signup">
                    <Users className="w-5 h-5 mr-2" />
                    Join Free Today
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                  <Link href="/community">Explore Community</Link>
                </Button>
              </>
            )}
            {isAuthenticated && (
              <Button asChild size="lg" className="px-8 py-3">
                <Link href="/community">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Join the Discussion
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
