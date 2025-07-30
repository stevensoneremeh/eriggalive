"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Trophy, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Player {
  id: string
  name: string
  color: "red" | "blue" | "green" | "yellow"
  avatar?: string
  pieces: number[]
  isActive: boolean
}

interface GameState {
  players: Player[]
  currentPlayer: number
  diceValue: number
  gameStatus: "waiting" | "playing" | "finished"
  winner?: string
  lastMove?: string
}

interface LudoGameProps {
  roomId: string
  onLeave: () => void
}

const DICE_ICONS = {
  1: Dice1,
  2: Dice2,
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6,
}

const PLAYER_COLORS = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
}

const BOARD_SIZE = 15
const HOME_POSITIONS = {
  red: [1, 2, 16, 17],
  blue: [13, 14, 28, 29],
  green: [211, 212, 226, 227],
  yellow: [199, 200, 214, 215],
}

export function LudoGame({ roomId, onLeave }: LudoGameProps) {
  const { profile } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    players: [
      {
        id: "1",
        name: profile?.username || "Player 1",
        color: "red",
        avatar: profile?.avatar_url,
        pieces: [1, 2, 16, 17],
        isActive: true,
      },
      {
        id: "2",
        name: "AI Player",
        color: "blue",
        pieces: [13, 14, 28, 29],
        isActive: true,
      },
    ],
    currentPlayer: 0,
    diceValue: 1,
    gameStatus: "playing",
  })

  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [canRollDice, setCanRollDice] = useState(true)
  const [gameTime, setGameTime] = useState(0)

  // Game timer
  useEffect(() => {
    if (gameState.gameStatus === "playing") {
      const timer = setInterval(() => {
        setGameTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState.gameStatus])

  const rollDice = useCallback(() => {
    if (!canRollDice || gameState.gameStatus !== "playing") return

    const newDiceValue = Math.floor(Math.random() * 6) + 1
    setGameState((prev) => ({
      ...prev,
      diceValue: newDiceValue,
      lastMove: `${prev.players[prev.currentPlayer].name} rolled ${newDiceValue}`,
    }))
    setCanRollDice(false)

    // AI turn simulation
    if (gameState.players[gameState.currentPlayer].name === "AI Player") {
      setTimeout(() => {
        nextTurn()
      }, 1500)
    }
  }, [canRollDice, gameState.gameStatus, gameState.currentPlayer])

  const nextTurn = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentPlayer: (prev.currentPlayer + 1) % prev.players.length,
    }))
    setCanRollDice(true)
    setSelectedPiece(null)
  }, [])

  const movePiece = useCallback(
    (pieceIndex: number) => {
      if (!gameState.players[gameState.currentPlayer].isActive) return

      const currentPlayer = gameState.players[gameState.currentPlayer]
      const newPieces = [...currentPlayer.pieces]
      newPieces[pieceIndex] += gameState.diceValue

      setGameState((prev) => {
        const newPlayers = [...prev.players]
        newPlayers[prev.currentPlayer] = {
          ...currentPlayer,
          pieces: newPieces,
        }

        return {
          ...prev,
          players: newPlayers,
          lastMove: `${currentPlayer.name} moved piece ${pieceIndex + 1}`,
        }
      })

      // Check for win condition (simplified)
      if (newPieces.every((pos) => pos >= 57)) {
        setGameState((prev) => ({
          ...prev,
          gameStatus: "finished",
          winner: currentPlayer.name,
        }))
        return
      }

      nextTurn()
    },
    [gameState, nextTurn],
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const DiceIcon = DICE_ICONS[gameState.diceValue as keyof typeof DICE_ICONS]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Game Board */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ludo Game - Room {roomId}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(gameTime)}
                </div>
                <Badge variant={gameState.gameStatus === "playing" ? "default" : "secondary"}>
                  {gameState.gameStatus}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {gameState.gameStatus === "finished" ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl text-muted-foreground mb-6">🎉 {gameState.winner} wins!</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => window.location.reload()}>Play Again</Button>
                  <Button variant="outline" onClick={onLeave}>
                    Leave Game
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Simplified Board Representation */}
                <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg p-4 relative">
                  <div className="absolute inset-4 border-4 border-white rounded-lg">
                    {/* Corner Houses */}
                    <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-red-200 dark:bg-red-800 rounded-tl-lg flex items-center justify-center">
                      <div className="text-xs font-bold text-red-800 dark:text-red-200">RED</div>
                    </div>
                    <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-200 dark:bg-blue-800 rounded-tr-lg flex items-center justify-center">
                      <div className="text-xs font-bold text-blue-800 dark:text-blue-200">BLUE</div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-yellow-200 dark:bg-yellow-800 rounded-bl-lg flex items-center justify-center">
                      <div className="text-xs font-bold text-yellow-800 dark:text-yellow-200">YELLOW</div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-green-200 dark:bg-green-800 rounded-br-lg flex items-center justify-center">
                      <div className="text-xs font-bold text-green-800 dark:text-green-200">GREEN</div>
                    </div>

                    {/* Center Star */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-yellow-800" />
                    </div>
                  </div>
                </div>

                {/* Game Controls */}
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={rollDice}
                      disabled={!canRollDice || gameState.players[gameState.currentPlayer].name !== profile?.username}
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <DiceIcon className="h-6 w-6" />
                      Roll Dice
                    </Button>
                  </div>

                  {gameState.lastMove && (
                    <p className="text-sm text-muted-foreground">Last move: {gameState.lastMove}</p>
                  )}
                </div>

                {/* Piece Selection */}
                {!canRollDice && gameState.players[gameState.currentPlayer].name === profile?.username && (
                  <div className="text-center space-y-4">
                    <p className="text-sm font-medium">Select a piece to move:</p>
                    <div className="flex justify-center gap-2">
                      {gameState.players[gameState.currentPlayer].pieces.map((position, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => movePiece(index)}
                          className={`${PLAYER_COLORS[gameState.players[gameState.currentPlayer].color]} text-white`}
                        >
                          Piece {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Info Sidebar */}
      <div className="space-y-4">
        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gameState.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  index === gameState.currentPlayer ? "bg-primary/10 border-primary" : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={player.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">{player.name}</div>
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${PLAYER_COLORS[player.color]}`} />
                    <span className="text-xs text-muted-foreground capitalize">{player.color}</span>
                  </div>
                </div>
                {index === gameState.currentPlayer && (
                  <Badge variant="default" className="text-xs">
                    Turn
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Game Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Game Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dice Value:</span>
              <span className="font-medium">{gameState.diceValue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Turn:</span>
              <span className="font-medium">{gameState.players[gameState.currentPlayer]?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Game Time:</span>
              <span className="font-medium">{formatTime(gameTime)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <Button variant="outline" onClick={onLeave} className="w-full bg-transparent">
              Leave Game
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
