"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Target, Heart, Users, Trophy, Star, ArrowRight, Music, Mic, Crown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"

export default function MissionPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
                🎯 Our Mission
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Empowering the{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Erigga Movement
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                We're building more than just a fan community. We're creating a platform that connects fans, supports
                artists, and celebrates the culture of Nigerian hip-hop.
              </p>
            </div>

            {/* Hero Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image
                  src="/images/hero/erigga1.jpeg"
                  alt="Erigga performing"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image
                  src="/images/hero/erigga2.jpeg"
                  alt="Erigga in studio"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image
                  src="/images/hero/erigga3.jpeg"
                  alt="Erigga with fans"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image
                  src="/images/hero/erigga4.jpeg"
                  alt="Erigga live performance"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="px-8 py-3">
                <Link href="/community">
                  <Users className="w-5 h-5 mr-2" />
                  Join Our Community
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Core Values</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                These principles guide everything we do and shape the community we're building together.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Authentic Connection</CardTitle>
                  <CardDescription>
                    We believe in genuine connections between artists and fans, fostering real relationships that go
                    beyond just music consumption.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Community First</CardTitle>
                  <CardDescription>
                    Our community is at the heart of everything we do. We prioritize fan experiences and create spaces
                    where everyone feels valued and heard.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Excellence</CardTitle>
                  <CardDescription>
                    We strive for excellence in every aspect of our platform, from user experience to content quality
                    and community management.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                    <Music className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <CardTitle>Cultural Pride</CardTitle>
                  <CardDescription>
                    We celebrate Nigerian hip-hop culture and provide a platform that showcases the richness and
                    diversity of our musical heritage.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                    <Mic className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Artist Empowerment</CardTitle>
                  <CardDescription>
                    We empower artists by providing direct access to their fanbase and innovative ways to monetize their
                    creativity and engagement.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                    <Crown className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle>Innovation</CardTitle>
                  <CardDescription>
                    We continuously innovate to create new ways for fans to engage with music and artists, setting new
                    standards in the industry.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Achievements Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Achievements</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Milestones that mark our journey in building the ultimate fan community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">10K+</div>
                  <p className="text-gray-600 dark:text-gray-300">Active Community Members</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">500+</div>
                  <p className="text-gray-600 dark:text-gray-300">Exclusive Content Pieces</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50+</div>
                  <p className="text-gray-600 dark:text-gray-300">Meet & Greet Sessions</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">4.9/5</div>
                  <p className="text-gray-600 dark:text-gray-300">Community Satisfaction</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Our Vision for the Future
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              We envision a world where the gap between artists and fans is bridged through technology, creating
              meaningful connections that transcend traditional boundaries. Our platform will become the gold standard
              for artist-fan engagement, not just in Nigeria, but across Africa and beyond.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Global Expansion</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Expanding our platform to serve artists and fans across Africa and the diaspora.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community Growth</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Building a million-strong community of passionate music fans and creators.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cultural Impact</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Becoming a catalyst for positive change in the African music industry.
                </p>
              </div>
            </div>
            <div className="mt-12">
              <Button asChild size="lg" className="px-8 py-3">
                <Link href="/community">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Be Part of Our Journey
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AuthGuard>
  )
}
