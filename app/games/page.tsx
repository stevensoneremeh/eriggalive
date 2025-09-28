"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Users, Clock, Trophy, Star, Play, Coins } from "lucide-react"
import Link from "next/link"

const games = [
  {
    id: "erigga-x-and-o",
    title: "Erigga X and O",
    description: "Classic tic-tac-toe with Erigga style! Challenge friends in real-time multiplayer battles.",
    difficulty: "Easy",
    players: "2 Players",
    duration: "2-5 min",
    rating: 4.8,
    image: "/placeholder.svg?height=200&width=300&text=Erigga+X+and+O",
    instructions: [
      "Challenge another player or join an existing game",
      "Take turns placing X's and O's on a 3x3 grid",
      "First player to get 3 in a row wins and earns coins",
      "Win streaks earn bonus rewards!",
    ],
    available: true,
    coinReward: 10,
    features: ["Multiplayer", "Real-time", "Coin Rewards"],
  },
  {
    id: "erigga-coin-collector",
    title: "Erigga Coin Collector",
    description: "Navigate through challenges and collect Erigga coins while avoiding obstacles!",
    difficulty: "Medium",
    players: "1 Player",
    duration: "5-15 min",
    rating: 4.6,
    image: "/placeholder.svg?height=200&width=300&text=Coin+Collector",
    instructions: [
      "Use arrow keys or touch controls to move your character",
      "Collect golden Erigga coins scattered throughout levels",
      "Avoid obstacles and enemies that reduce your score",
      "Complete levels to unlock new challenges and earn bonus coins",
    ],
    available: true,
    coinReward: 25,
    features: ["Single Player", "Progressive Levels", "High Scores"],
  },
  {
    id: "memory-game",
    title: "Erigga Memory Match",
    description: "Test your memory by matching pairs of Erigga-themed cards",
    difficulty: "Medium",
    players: "1 Player",
    duration: "5-10 min",
    rating: 4.2,
    image: "/placeholder.svg?height=200&width=300&text=Memory+Game",
    instructions: [
      "Cards are placed face down on the table",
      "Flip two cards at a time to find matching pairs",
      "If cards match, they stay face up. If not, they flip back",
      "Win by matching all pairs in the fewest moves",
    ],
    available: false,
    coinReward: 15,
    features: ["Brain Training", "Timed Challenges", "Difficulty Levels"],
  },
  {
    id: "word-puzzle",
    title: "Erigga Word Hunt",
    description: "Find hidden words related to Erigga's music and career",
    difficulty: "Hard",
    players: "1 Player",
    duration: "10-15 min",
    rating: 4.7,
    image: "/placeholder.svg?height=200&width=300&text=Word+Puzzle",
    instructions: [
      "Find words hidden in a grid of letters",
      "Words can be horizontal, vertical, or diagonal",
      "All words are related to Erigga's music and career",
      "Find all words to complete the puzzle and earn coins",
    ],
    available: false,
    coinReward: 30,
    features: ["Music Themed", "Multiple Difficulties", "Educational"],
  },
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400"
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
    case "hard":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Erigga Games
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Challenge yourself with our collection of fun and engaging games. Test your skills, compete with friends,
            and earn Erigga coins as rewards!
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6 mb-8 max-w-6xl mx-auto">
          {games.map((game) => (
            <Card
              key={game.id}
              className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                !game.available ? "opacity-75" : ""
              }`}
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {!game.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-white bg-black/70">
                        Coming Soon
                      </Badge>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className={getDifficultyColor(game.difficulty)}>{game.difficulty}</Badge>
                    {game.available && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
                        <Coins className="h-3 w-3 mr-1" />+{game.coinReward}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <CardTitle className="text-xl font-bold">{game.title}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{game.rating}</span>
                  </div>
                </div>

                <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {game.description}
                </CardDescription>

                {/* Game Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {game.players}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {game.duration}
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {game.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                {/* Instructions Preview */}
                {selectedGame === game.id && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">How to Play:</h4>
                    <ul className="text-xs space-y-1">
                      {game.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">•</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {game.available ? (
                    <Button
                      asChild
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Link href={`/games/${game.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Play Now
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="flex-1">
                      <Clock className="h-4 w-4 mr-2" />
                      Coming Soon
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                  >
                    {selectedGame === game.id ? "Hide" : "Rules"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <Card className="text-center p-6">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold">{games.filter((g) => g.available).length}</h3>
            <p className="text-muted-foreground">Games Available</p>
          </Card>

          <Card className="text-center p-6">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold">1,234</h3>
            <p className="text-muted-foreground">Players Online</p>
          </Card>

          <Card className="text-center p-6">
            <Gamepad2 className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold">5,678</h3>
            <p className="text-muted-foreground">Games Played</p>
          </Card>

          <Card className="text-center p-6">
            <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold">12,345</h3>
            <p className="text-muted-foreground">Coins Earned</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
