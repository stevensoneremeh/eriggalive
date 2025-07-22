"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Bot, Trophy, Coins, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type PlayerColor = "red" | "blue" | "green" | "yellow"
type GameMode = "vs-system" | "vs-players" | null
type GameState = "waiting" | "playing" | "finished"

interface Player {
  id: string
  name: string
  color: PlayerColor
  avatar?: string
  isBot: boolean
  pieces: number[]
  isCurrentPlayer: boolean
  coins: number
}

interface GameRoom {
  id: string
  players: Player[]
  currentPlayer: number
  gameState: GameState
  winner?: Player
  diceValue: number
  isRolling: boolean
}

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
const PLAYER_COLORS: PlayerColor[] = ["red", "blue", "green", "yellow"]

const BOARD_POSITIONS = Array.from({ length: 52 }, (_, i) => i)
const HOME_POSITIONS = {
  red: [0, 1, 2, 3],
  blue: [4, 5, 6, 7],
  green: [8, 9, 10, 11],
  yellow: [12, 13, 14, 15],
}

export function LudoGame() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const createSystemGame = () => {
    if (!profile) return

    const systemPlayer: Player = {
      id: "system",
      name: "Erigga AI",
      color: "blue",
      avatar: "/placeholder.svg",
      isBot: true,
      pieces: [4, 5, 6, 7],
      isCurrentPlayer: false,
      coins: 0,
    }

    const humanPlayer: Player = {
      id: profile.id,
      name: profile.full_name || profile.username,
      color: "red",
      avatar: profile.avatar_url || "/placeholder.svg",
      isBot: false,
      pieces: [0, 1, 2, 3],
      isCurrentPlayer: true,
      coins: profile.coins_balance || 0,
    }

    const newRoom: GameRoom = {
      id: `game-${Date.now()}`,
      players: [humanPlayer, systemPlayer],
      currentPlayer: 0,
      gameState: "playing",
      diceValue: 1,
      isRolling: false,
    }

    setGameRoom(newRoom)
    setGameMode("vs-system")

    toast({
      title: "Game Started!",
      description: "You're playing against Erigga AI. Good luck!",
    })
  }

  const searchForPlayers = () => {
    setIsSearching(true)
    setGameMode("vs-players")

    // Simulate finding players
    setTimeout(() => {
      if (!profile) return

      const mockPlayers: Player[] = [
        {
          id: profile.id,
          name: profile.full_name || profile.username,
          color: "red",
          avatar: profile.avatar_url || "/placeholder.svg",
          isBot: false,
          pieces: [0, 1, 2, 3],
          isCurrentPlayer: true,
          coins: profile.coins_balance || 0,
        },
        {
          id: "player2",
          name: "Warri King",
          color: "blue",
          avatar: "/placeholder.svg",
          isBot: false,
          pieces: [4, 5, 6, 7],
          isCurrentPlayer: false,
          coins: 250,
        },
        {
          id: "player3",
          name: "Street Legend",
          color: "green",
          avatar: "/placeholder.svg",
          isBot: false,
          pieces: [8, 9, 10, 11],
          isCurrentPlayer: false,
          coins: 180,
        },
        {
          id: "player4",
          name: "Music Lover",
          color: "yellow",
          avatar: "/placeholder.svg",
          isBot: false,
          pieces: [12, 13, 14, 15],
          isCurrentPlayer: false,
          coins: 320,
        },
      ]

      const newRoom: GameRoom = {
        id: `multiplayer-${Date.now()}`,
        players: mockPlayers,
        currentPlayer: 0,
        gameState: "playing",
        diceValue: 1,
        isRolling: false,
      }

      setGameRoom(newRoom)
      setIsSearching(false)

      toast({
        title: "Players Found!",
        description: "4-player game is starting now!",
      })
    }, 3000)
  }

  const rollDice = () => {
    if (!gameRoom || gameRoom.isRolling) return

    setGameRoom((prev) => (prev ? { ...prev, isRolling: true } : null))

    // Animate dice roll
    let rollCount = 0
    const rollInterval = setInterval(() => {
      const randomValue = Math.floor(Math.random() * 6) + 1
      setGameRoom((prev) => (prev ? { ...prev, diceValue: randomValue } : null))
      rollCount++

      if (rollCount >= 10) {
        clearInterval(rollInterval)
        const finalValue = Math.floor(Math.random() * 6) + 1

        setGameRoom((prev) => {
          if (!prev) return null

          const nextPlayer = (prev.currentPlayer + 1) % prev.players.length
          return {
            ...prev,
            diceValue: finalValue,
            isRolling: false,
            currentPlayer: nextPlayer,
            players: prev.players.map((player, index) => ({
              ...player,
              isCurrentPlayer: index === nextPlayer,
            })),
          }
        })

        // Handle bot turn
        if (gameMode === "vs-system" && gameRoom.players[1].isBot) {
          setTimeout(() => {
            handleBotTurn()
          }, 1500)
        }
      }
    }, 100)
  }

  const handleBotTurn = () => {
    if (!gameRoom) return

    // Simulate bot thinking
    setTimeout(() => {
      rollDice()
    }, 1000)
  }

  const resetGame = () => {
    setGameRoom(null)
    setGameMode(null)
    setIsSearching(false)
  }

  const quitGame = () => {
    if (gameRoom && gameMode === "vs-players") {
      toast({
        title: "Game Left",
        description: "You have left the multiplayer game.",
        variant: "destructive",
      })
    }
    resetGame()
  }

  if (!profile) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground mb-4">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <p>Sign in to play Ludo games</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!gameMode) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Dice1 className="h-5 w-5 text-white" />
            </div>
            Ludo Game
          </CardTitle>
          <p className="text-muted-foreground">Choose your game mode and start playing!</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer group"
              onClick={createSystemGame}
            >
              <CardContent className="p-6 text-center">
                <Bot className="h-12 w-12 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">Play vs AI</h3>
                <p className="text-sm text-muted-foreground mb-4">Challenge Erigga AI in a quick game</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span>Win: +50 coins</span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2 border-dashed border-green-200 hover:border-green-400 transition-colors cursor-pointer group"
              onClick={searchForPlayers}
            >
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">Multiplayer</h3>
                <p className="text-sm text-muted-foreground mb-4">Play with other community members</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Win: +100 coins</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>Your Balance: {profile.coins_balance || 0} coins</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>Entry: Free</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isSearching) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h3 className="font-semibold mb-2">Finding Players...</h3>
          <p className="text-muted-foreground mb-4">Looking for other community members to play with</p>
          <Button variant="outline" onClick={resetGame}>
            Cancel Search
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!gameRoom) return null

  const currentPlayer = gameRoom.players[gameRoom.currentPlayer]
  const DiceIcon = DICE_ICONS[gameRoom.diceValue - 1]
  const isMyTurn = currentPlayer.id === profile.id

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Dice1 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Ludo Game</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {gameMode === "vs-system" ? "Playing vs AI" : "Multiplayer Game"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetGame}>
                <RotateCcw className="h-4 w-4 mr-2" />
                New Game
              </Button>
              <Button variant="outline" size="sm" onClick={quitGame}>
                Quit
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Players */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gameRoom.players.map((player, index) => (
          <Card
            key={player.id}
            className={cn(
              "border-2 transition-all",
              player.isCurrentPlayer ? "border-primary shadow-lg scale-105" : "border-muted",
            )}
          >
            <CardContent className="p-4 text-center">
              <Avatar className="h-12 w-12 mx-auto mb-2">
                <AvatarImage src={player.avatar || "/placeholder.svg"} />
                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h4 className="font-medium text-sm mb-1">{player.name}</h4>
              <div className="flex items-center justify-center gap-1 mb-2">
                {player.isBot ? <Bot className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    player.color === "red" && "border-red-500 text-red-500",
                    player.color === "blue" && "border-blue-500 text-blue-500",
                    player.color === "green" && "border-green-500 text-green-500",
                    player.color === "yellow" && "border-yellow-500 text-yellow-500",
                  )}
                >
                  {player.color}
                </Badge>
              </div>
              {player.isCurrentPlayer && <div className="text-xs text-primary font-medium">Current Turn</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Board */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border-4 border-dashed border-muted-foreground/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎲</div>
              <p className="text-lg font-semibold mb-2">Ludo Board</p>
              <p className="text-sm text-muted-foreground">Classic board game experience</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dice and Controls */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="mb-2">
                <Button
                  size="lg"
                  onClick={rollDice}
                  disabled={!isMyTurn || gameRoom.isRolling}
                  className={cn("w-16 h-16 rounded-full", gameRoom.isRolling && "animate-bounce")}
                >
                  <DiceIcon className="h-8 w-8" />
                </Button>
              </div>
              <p className="text-sm font-medium">
                {gameRoom.isRolling ? "Rolling..." : `Rolled: ${gameRoom.diceValue}`}
              </p>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold mb-1">
                {isMyTurn ? "Your Turn!" : `${currentPlayer.name}'s Turn`}
              </div>
              <p className="text-sm text-muted-foreground">
                {isMyTurn ? "Click the dice to roll" : "Waiting for player..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Stats */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>Potential Reward: {gameMode === "vs-system" ? "50" : "100"} coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>Your Balance: {profile.coins_balance || 0} coins</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
