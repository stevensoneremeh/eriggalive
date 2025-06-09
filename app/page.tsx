"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Users, ShoppingBag, Calendar } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

// Fallback content when data fetching fails
const fallbackContent = {
  latestContent: {
    title: "Street Anthem 2024",
    description: "The latest banger from the Paper Boi himself",
    thumbnail_url: null,
  },
  events: [
    { id: 1, title: "Warri Live Show", event_date: "2024-12-25", ticket_price: 500000 },
    { id: 2, title: "Lagos Concert", event_date: "2025-01-15", ticket_price: 1000000 },
  ],
}

export default function HomePage() {
  const { user, profile } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Upcoming"
    }
  }

  const formatPrice = (priceInKobo: number) => {
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(priceInKobo / 100)
    } catch (error) {
      console.error("Price formatting error:", error)
      return "₦0.00"
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Static Background Image - No video for now to eliminate potential errors */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://sjc.microlink.io/IaN12rZuSAqtEATHm3KCTGa2_hNlLsaQg4BsrIa3dGYlV_tAjMf5vMocKaI5sKhQYuShLe9MIP1Emy_1sSqlOA.jpeg)`,
            filter: "brightness(0.8) contrast(1.1) saturate(1.1)",
          }}
        />

        {/* Video Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-street text-6xl md:text-8xl lg:text-9xl text-gradient glow-text mb-6 animate-fade-in">
            ERIGGA
          </h1>
          <p className="text-xl md:text-3xl font-bold text-white mb-4 animate-fade-in">STREET MADE, GLOBAL RESPECTED</p>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in">
            Join the movement. Connect with real fans. Experience the culture.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            {isClient && user ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-lg px-8 py-4 street-shadow"
                >
                  <Link href="/premium">
                    {profile?.tier === "erigma_circle" ? "Access Vault" : "Join Erigma Circle"}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black font-bold text-lg px-8 py-4"
                >
                  <Link href="/community">Explore Community</Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-lg px-8 py-4 street-shadow"
                >
                  <Link href="/login">Join Erigma Circle</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black font-bold text-lg px-8 py-4"
                >
                  <Link href="/community">Explore Community</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-orange-500 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-orange-500 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Preview Sections */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Latest Drop */}
            <Card className="bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-orange-500 flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Latest Drop
                  </CardTitle>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                    NEW
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-gold-400/20 rounded-lg mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Play className="h-12 w-12 text-orange-500" />
                </div>
                <h3 className="font-bold mb-2">{fallbackContent.latestContent.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{fallbackContent.latestContent.description}</p>
                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                  <Link href="/vault">Listen Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Fan Feed */}
            <Card className="bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-gold-400 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Fan Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-gold-400 rounded-full" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Fan dropped some fire bars...</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black"
                >
                  <Link href="/community">Join Discussion</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Merch */}
            <Card className="bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-orange-500 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Merch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-gold-400/20 rounded-lg mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShoppingBag className="h-12 w-12 text-orange-500" />
                </div>
                <h3 className="font-bold mb-2">Paper Boi Collection</h3>
                <p className="text-sm text-muted-foreground mb-4">Street wear that speaks your language</p>
                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                  <Link href="/merch">Shop Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Events */}
            <Card className="bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-gold-400 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {fallbackContent.events.map((event) => (
                    <div key={event.id} className="p-3 bg-orange-500/10 rounded-lg">
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.event_date)} • {formatPrice(event.ticket_price)}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black"
                >
                  <Link href="/tickets">Get Tickets</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500/10 to-gold-400/10">
        <div className="container mx-auto text-center">
          <h2 className="font-street text-4xl md:text-6xl text-gradient mb-12">THE MOVEMENT</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-orange-500">50K+</div>
              <div className="text-sm text-muted-foreground">Active Fans</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-gold-400">100+</div>
              <div className="text-sm text-muted-foreground">Exclusive Tracks</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-orange-500">25+</div>
              <div className="text-sm text-muted-foreground">Live Shows</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-gold-400">1M+</div>
              <div className="text-sm text-muted-foreground">Streams</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
