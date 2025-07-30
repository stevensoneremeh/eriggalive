"use client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Users, Trophy, Clock, Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const games = [
  {
    id: "ludo",
    name: "Ludo",
    description: "Classic board game for 2-4 players",
    players: "2-4 Players",
    duration: "15-30 min",
    difficulty: "Easy",
    image: "/placeholder.svg?height=200&width=300&text=Ludo",
    href: "/games/ludo",
    featured: true,
  },
  {
    id: "coming-soon-1",
    name: "Word Challenge",
    description: "Test your vocabulary with Erigga lyrics",
    players: "1-8 Players",
    duration: "10-15 min",
    difficulty: "Medium",
    image: "/placeholder.svg?height=200&width=300&text=Word+Challenge",
    href: "#",
    comingSoon: true,
  },
  {
    id: "coming-soon-2",
    name: "Music Quiz",
    description: "Guess the Erigga song from audio clips",
    players: "1-10 Players",
    duration: "5-10 min",
    difficulty: "Hard",
    image: "/placeholder.svg?height=200&width=300&text=Music+Quiz",
    href: "#",
    comingSoon: true,
  },
]

export default function GamesPage() {
  const { isAuthenticated, profile } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Gamepad2 className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Erigga Games
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Play games, compete with other fans, and earn coins while having fun in the Erigga community.
          </p>
        </div>

        {/* User Stats */}
        {isAuthenticated && profile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Games Won</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Games Played</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Ranking</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">0h</div>
                <div className="text-sm text-muted-foreground">Time Played</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {game.featured && <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">Featured</Badge>}
                  {game.comingSoon && <Badge className="absolute top-2 left-2 bg-gray-500">Coming Soon</Badge>}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="mb-2">{game.name}</CardTitle>
                <CardDescription className="mb-4">{game.description}</CardDescription>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {game.players}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {game.duration}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {game.difficulty}
                  </Badge>
                </div>

                {game.comingSoon ? (
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                ) : isAuthenticated ? (
                  <Button asChild className="w-full">
                    <Link href={game.href}>Play Now</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/login">Sign in to Play</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-4">Join the Fun!</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Sign up to play games, compete with other fans, and earn coins in the Erigga community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/signup">Sign Up Free</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
