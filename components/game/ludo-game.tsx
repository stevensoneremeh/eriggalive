"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Coins, Trophy, ArrowLeft, Play, Pause } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Player {
  id: string
  username: string
  display_name: string
  avatar_url?: string
}

interface GameState {
  board: (string | null)[]
  players: Record<
    string,
    {
      color: string
      pieces: number[]
      position: string
    }
  >
  currentTurn: string
  diceValue: number | null
  winner?: string
  status: "waiting" | "active" | "finished"
}

interface LudoGameProps {
  gameId: string
  initialGameState?: GameState
  roomName?: string
  prizePool?: number
  players?: Player[]
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

export function LudoGame({ gameId, initialGameState, roomName, prizePool, players = [] }: LudoGameProps) {
  const [gameState, setGameState] = useState<GameState>(
    initialGameState || {
      board: Array(40).fill(null),
      players: {},
      currentTurn: "",
      diceValue: null,
      status: "waiting",
    },
  )
  const [isRolling, setIsRolling] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!mounted) return

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ludo_games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new.game_state) {
            setGameState(payload.new.game_state)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, mounted, supabase])

  const rollDice = useCallback(async () => {
    if (!user || gameState.currentTurn !== user.id || isRolling) return

    setIsRolling(true)

    try {
      const diceValue = Math.floor(Math.random() * 6) + 1

      const updatedGameState = {
        ...gameState,
        diceValue,
      }

      const { error } = await supabase.from("ludo_games").update({ game_state: updatedGameState }).eq("id", gameId)

      if (error) throw error

      setGameState(updatedGameState)
      toast.success(`You rolled a ${diceValue}!`)
    } catch (error) {
      console.error("Error rolling dice:", error)
      toast.error("Failed to roll dice")
    } finally {
      setIsRolling(false)
    }
  }, [user, gameState, isRolling, gameId, supabase])

  const movePiece = useCallback(
    async (pieceIndex: number) => {
      if (!user || gameState.currentTurn !== user.id || !gameState.diceValue) return

      try {
        const playerData = gameState.players[user.id]
        if (!playerData) return

        const newPieces = [...playerData.pieces]
        newPieces[pieceIndex] = Math.min(newPieces[pieceIndex] + gameState.diceValue, 40)

        // Check for win condition
        const hasWon = newPieces.every((piece) => piece >= 40)

        const updatedPlayers = {
          ...gameState.players,
          [user.id]: {
            ...playerData,
            pieces: newPieces,
          },
        }

        // Get next player
        const playerIds = Object.keys(gameState.players)
        const currentIndex = playerIds.indexOf(user.id)
        const nextIndex = (currentIndex + 1) % playerIds.length
        const nextPlayer = playerIds[nextIndex]

        const updatedGameState = {
          ...gameState,
          players: updatedPlayers,
          currentTurn: hasWon ? user.id : nextPlayer,
          diceValue: null,
          winner: hasWon ? user.id : undefined,
          status: hasWon ? ("finished" as const) : gameState.status,
        }

        const { error } = await supabase
          .from("ludo_games")
          .update({
            game_state: updatedGameState,
            status: hasWon ? "finished" : gameState.status,
          })
          .eq("id", gameId)

        if (error) throw error

        setGameState(updatedGameState)

        if (hasWon) {
          toast.success("Congratulations! You won the game!")

          // Award prize to winner
          if (profile && prizePool) {
            const { error: prizeError } = await supabase
              .from("profiles")
              .update({
                coins_balance: profile.coins_balance + prizePool,
              })
              .eq("id", user.id)

            if (!prizeError) {
              toast.success(`You won ${prizePool} coins!`)
            }
          }
        } else {
          toast.success("Piece moved!")
        }
      } catch (error) {
        console.error("Error moving piece:", error)
        toast.error("Failed to move piece")
      }
    },
    [user, gameState, gameId, supabase, profile, prizePool],
  )

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const currentPlayer = user ? gameState.players[user.id] : null
  const isMyTurn = user && gameState.currentTurn === user.id
  const DiceIcon = gameState.diceValue ? DICE_ICONS[gameState.diceValue as keyof typeof DICE_ICONS] : Dice1

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/games">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{roomName || "Ludo Game"}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {Object.keys(gameState.players).length} players
              </span>
              {prizePool && (
                <span className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  {prizePool} coins prize
                </span>
              )}
            </div>
          </div>
        </div>

        <Badge variant={gameState.status === "active" ? "default" : "secondary"}>
          {gameState.status === "waiting" && <Pause className="h-3 w-3 mr-1" />}
          {gameState.status === "active" && <Play className="h-3 w-3 mr-1" />}
          {gameState.status === "finished" && <Trophy className="h-3 w-3 mr-1" />}
          {gameState.status.charAt(0).toUpperCase() + gameState.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Game Board</span>
                {gameState.winner && (
                  <Badge variant="default" className="bg-yellow-500">
                    <Trophy className="h-3 w-3 mr-1" />
                    Winner: {players.find((p) => p.id === gameState.winner)?.username}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simplified board representation */}
              <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg p-4 relative">
                {/* Center area */}
                <div className="absolute inset-1/4 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">LUDO</h3>
                    {isMyTurn && gameState.status === "active" && (
                      <Button onClick={rollDice} disabled={isRolling || !!gameState.diceValue} className="mb-2">
                        {isRolling ? "Rolling..." : gameState.diceValue ? "Move Piece" : "Roll Dice"}
                      </Button>
                    )}
                    {gameState.diceValue && (
                      <div className="flex items-center justify-center">
                        <DiceIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Player home areas */}
                <div className="absolute top-2 left-2 w-1/3 h-1/3 bg-red-200 dark:bg-red-800 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-red-800 dark:text-red-200">RED</span>
                </div>
                <div className="absolute top-2 right-2 w-1/3 h-1/3 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-blue-800 dark:text-blue-200">BLUE</span>
                </div>
                <div className="absolute bottom-2 left-2 w-1/3 h-1/3 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-green-800 dark:text-green-200">GREEN</span>
                </div>
                <div className="absolute bottom-2 right-2 w-1/3 h-1/3 bg-yellow-200 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-yellow-800 dark:text-yellow-200">YELLOW</span>
                </div>
              </div>

              {/* Player pieces controls */}
              {currentPlayer && gameState.diceValue && isMyTurn && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Move your pieces:</h4>
                  <div className="flex gap-2">
                    {currentPlayer.pieces.map((position, index) => (
                      <Button
                        key={index}
                        onClick={() => movePiece(index)}
                        variant="outline"
                        size="sm"
                        className={`${PLAYER_COLORS[currentPlayer.color as keyof typeof PLAYER_COLORS]} text-white`}
                        disabled={position >= 40}
                      >
                        Piece {index + 1} ({position >= 40 ? "Finished" : `Pos: ${position}`})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Players Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {players.map((player) => {
                const playerData = gameState.players[player.id]
                const isCurrentTurn = gameState.currentTurn === player.id
                const isWinner = gameState.winner === player.id

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isCurrentTurn ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar_url || "/placeholder.svg"} alt={player.username} />
                      <AvatarFallback>{player.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{player.display_name}</p>
                        {playerData && (
                          <div
                            className={`w-3 h-3 rounded-full ${
                              PLAYER_COLORS[playerData.color as keyof typeof PLAYER_COLORS]
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">@{player.username}</p>
                      {playerData && (
                        <p className="text-xs text-muted-foreground">
                          Pieces: {playerData.pieces.filter((p) => p >= 40).length}/4 finished
                        </p>
                      )}
                    </div>
                    {isCurrentTurn && !isWinner && (
                      <Badge variant="default" className="text-xs">
                        Turn
                      </Badge>
                    )}
                    {isWinner && (
                      <Badge variant="default" className="bg-yellow-500 text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Game Status */}
          <Card>
            <CardHeader>
              <CardTitle>Game Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant="outline">{gameState.status}</Badge>
              </div>
              {prizePool && (
                <div className="flex justify-between text-sm">
                  <span>Prize Pool:</span>
                  <span className="flex items-center gap-1 font-medium text-yellow-600">
                    <Coins className="h-3 w-3" />
                    {prizePool}
                  </span>
                </div>
              )}
              {gameState.diceValue && (
                <div className="flex justify-between text-sm">
                  <span>Last Roll:</span>
                  <div className="flex items-center gap-1">
                    <DiceIcon className="h-4 w-4" />
                    <span>{gameState.diceValue}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
