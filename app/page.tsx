import { HeroVideoCarousel } from "@/components/hero-video-carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Play, Calendar, Users, Trophy, Headphones } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        <HeroVideoCarousel />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              Welcome to <span className="text-orange-500">Erigga Live</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              The official platform for exclusive content, music, and the ultimate fan experience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                <Play className="mr-2 h-5 w-5" />
                Explore Content
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black bg-transparent"
              >
                <Headphones className="mr-2 h-5 w-5" />
                Listen Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience Erigga Like Never Before</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get access to exclusive content, connect with fellow fans, and be part of the movement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Exclusive Content */}
            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Music className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle>Exclusive Content</CardTitle>
                <CardDescription>
                  Access unreleased tracks, behind-the-scenes footage, and exclusive interviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/vault">
                  <Button variant="outline" className="w-full bg-transparent">
                    Explore Vault
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Live Events */}
            <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Live Events</CardTitle>
                <CardDescription>Get tickets to exclusive concerts, meet & greets, and special events</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tickets">
                  <Button variant="outline" className="w-full bg-transparent">
                    View Events
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium Experience */}
            <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Premium Experience</CardTitle>
                <CardDescription>Unlock premium features, exclusive merchandise, and VIP access</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/premium">
                  <Button variant="outline" className="w-full bg-transparent">
                    Go Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Updates */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest from Erigga</h2>
            <p className="text-xl text-muted-foreground">Stay updated with the latest music, news, and announcements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Latest Track */}
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">New Release</Badge>
                <CardTitle>Latest Track</CardTitle>
                <CardDescription>Check out the newest addition to Erigga's discography</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                  <Play className="h-12 w-12 text-white" />
                </div>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Listen Now
                </Button>
              </CardContent>
            </Card>

            {/* Chronicles */}
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">
                  Chronicles
                </Badge>
                <CardTitle>Behind the Scenes</CardTitle>
                <CardDescription>Get an inside look at Erigga's creative process and journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <Link href="/chronicles">
                  <Button variant="outline" className="w-full bg-transparent">
                    Read Chronicles
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Merchandise */}
            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  Merch
                </Badge>
                <CardTitle>Official Merchandise</CardTitle>
                <CardDescription>Rep the brand with official Erigga merchandise and apparel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
                <Link href="/merch">
                  <Button variant="outline" className="w-full bg-transparent">
                    Shop Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join the Movement?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience exclusive content, connect with the community, and be part of something bigger
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vault">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                Explore Vault
              </Button>
            </Link>
            <Link href="/premium">
              <Button size="lg" variant="outline">
                Go Premium
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
