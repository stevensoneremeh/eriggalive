import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, Play, Calendar, Users, Trophy, Headphones, Archive, Crown, ShoppingBag, Coins } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to Erigga Live</h1>
        <p className="text-xl text-muted-foreground">
          Your gateway to exclusive content, music, and the ultimate fan experience
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">150+</p>
                <p className="text-sm text-muted-foreground">Tracks Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">50K+</p>
                <p className="text-sm text-muted-foreground">Active Fans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">VIP</p>
                <p className="text-sm text-muted-foreground">Experience Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Features */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Featured Content
              </CardTitle>
              <CardDescription>Latest releases and exclusive content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="aspect-video bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Latest Track</h3>
                    <p className="text-sm text-muted-foreground">New release from Erigga</p>
                    <Badge className="mt-1">New</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Behind the Scenes</h3>
                    <p className="text-sm text-muted-foreground">Exclusive studio footage</p>
                    <Badge variant="secondary" className="mt-1">
                      Exclusive
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href="/vault">
                  <Button>
                    <Archive className="mr-2 h-4 w-4" />
                    Explore Vault
                  </Button>
                </Link>
                <Button variant="outline">
                  <Headphones className="mr-2 h-4 w-4" />
                  Listen Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Don't miss out on exclusive events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Live Concert - Lagos</h3>
                    <p className="text-sm text-muted-foreground">December 25, 2024 • 8:00 PM</p>
                  </div>
                  <Badge>Available</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Meet & Greet Session</h3>
                    <p className="text-sm text-muted-foreground">January 15, 2025 • 6:00 PM</p>
                  </div>
                  <Badge variant="secondary">VIP Only</Badge>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/tickets">
                  <Button className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    View All Events
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access your favorite features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/vault">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Archive className="mr-2 h-4 w-4" />
                  Explore Vault
                </Button>
              </Link>
              <Link href="/chronicles">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="mr-2 h-4 w-4" />
                  Read Chronicles
                </Button>
              </Link>
              <Link href="/tickets">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="mr-2 h-4 w-4" />
                  Get Tickets
                </Button>
              </Link>
              <Link href="/merch">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Shop Merch
                </Button>
              </Link>
              <Link href="/premium">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Crown className="mr-2 h-4 w-4" />
                  Go Premium
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Erigga Coins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Erigga Coins
              </CardTitle>
              <CardDescription>Your digital currency for exclusive content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-3xl font-bold text-yellow-500">1,250</p>
                  <p className="text-sm text-muted-foreground">Available Coins</p>
                </div>
                <div className="space-y-2">
                  <Link href="/coins">
                    <Button className="w-full">
                      <Coins className="mr-2 h-4 w-4" />
                      Manage Coins
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full bg-transparent">
                    Earn More Coins
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest News */}
          <Card>
            <CardHeader>
              <CardTitle>Latest News</CardTitle>
              <CardDescription>Stay updated with Erigga</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">New Album Announcement</h4>
                  <p className="text-xs text-muted-foreground">Erigga announces upcoming album release...</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Tour Dates Revealed</h4>
                  <p className="text-xs text-muted-foreground">Check out the cities Erigga will be visiting...</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Collaboration News</h4>
                  <p className="text-xs text-muted-foreground">Exciting collaboration with top artists...</p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full bg-transparent">
                  Read More News
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
