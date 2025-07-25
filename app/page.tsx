"use client"

import { HeroVideo } from "@/components/hero-video"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, Users, Video, ShoppingBag, Radio, Calendar } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

const features = [
  {
    icon: Music,
    title: "Exclusive Music Vault",
    description: "Access unreleased tracks, behind-the-scenes content, and exclusive music videos.",
    href: "/vault",
    badge: "Premium",
  },
  {
    icon: Users,
    title: "Community Hub",
    description: "Connect with fellow fans, share content, and participate in discussions.",
    href: "/community",
    badge: "Free",
  },
  {
    icon: Video,
    title: "Meet & Greet Sessions",
    description: "Book personal video calls and meet-and-greet sessions with Erigga.",
    href: "/meet-greet",
    badge: "Exclusive",
  },
  {
    icon: Radio,
    title: "Erigga Radio",
    description: "24/7 streaming of Erigga's hits and curated Nigerian hip-hop.",
    href: "/radio",
    badge: "Live",
  },
  {
    icon: ShoppingBag,
    title: "Official Merchandise",
    description: "Shop exclusive merchandise and limited edition items.",
    href: "/merch",
    badge: "Shop",
  },
  {
    icon: Calendar,
    title: "Events & Tours",
    description: "Get early access to concert tickets and exclusive events.",
    href: "/tickets",
    badge: "Events",
  },
]

export default function HomePage() {
  const { user, profile } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen">
        <HeroVideo src="/videos/hero-video.mp4" poster="/images/hero/erigga1.jpeg" className="h-full w-full" />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">Welcome to Erigga's World</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Experience exclusive music, connect with the community, and get closer to your favorite artist
            </p>

            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/vault">Explore Vault</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  <Link href="/community">Join Community</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/signup">Join Now</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need in One Place</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From exclusive music to personal interactions, discover all the ways to connect with Erigga and the
              community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <feature.icon className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">{feature.badge}</Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full group-hover:bg-primary/90">
                    <Link href={feature.href}>Explore</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome Message for Authenticated Users */}
      {user && profile && (
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome back, {profile.full_name}!</h2>
            <p className="text-xl text-muted-foreground mb-8">
              You're a {profile.tier} member with {profile.coin_balance} coins. Ready to explore what's new?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/community">Check Community</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join the Movement?</h2>
          <p className="text-xl mb-8 opacity-90">
            Get exclusive access to music, connect with fans worldwide, and be part of Erigga's journey.
          </p>
          {!user && (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Start Your Journey</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
