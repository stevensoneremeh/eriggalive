"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Trophy } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Player {
  id: string
  username: string
  avatar_url?: string
  color: string
  pieces: number[]
  isOnline: boolean
}

interface GameState {
  id: string
  players: Player[]
  currentPlayer: number
  gameStatus: "waiting" | "active" | "finished"
  winner?: string
  diceValue: number
  lastMove: string
  created_at: string
}

const DICE_ICONS = {
  1: Dice1,
  2: Dice2,
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6,
}

const PLAYER_COLORS = ["red", "blue", "green", "yellow"]

export function LudoGame({ gameId }: { gameId: string }) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [diceRolling, setDiceRolling] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const { user, profile } = useAuth()
  const supabase = createClient()

  const rollDice = useCallback(async () => {
    if (!gameState || !user || gameState.currentPlayer !== getCurrentPlayerIndex()) {
      return
    }

    setDiceRolling(true)

    // Simulate dice roll animation
    setTimeout(async () => {
      const diceValue = Math.floor(Math.random() * 6) + 1

      try {
        await supabase
          .from("ludo_games")
          .update({
            dice_value: diceValue,
            last_move: `${user.id} rolled ${diceValue}`,
          })
          .eq("id", gameId)

        setDiceRolling(false)
      } catch (error) {
        console.error("Error rolling dice:", error)
        toast.error("Failed to roll dice")
        setDiceRolling(false)
      }
    }, 1000)
  }, [gameState, user, gameId, supabase])

  const getCurrentPlayerIndex = useCallback(() => {
    if (!gameState || !user) return -1
    return gameState.players.findIndex((p) => p.id === user.id)
  }, [gameState, user])

  const movePiece = useCallback(
    async (pieceIndex: number) => {
      if (!gameState || !user || gameState.currentPlayer !== getCurrentPlayerIndex()) {
        return
      }

      try {
        const currentPlayerData = gameState.players[gameState.currentPlayer]
        const newPieces = [...currentPlayerData.pieces]
        newPieces[pieceIndex] = Math.min(newPieces[pieceIndex] + gameState.diceValue, 56)

        const updatedPlayers = [...gameState.players]
        updatedPlayers[gameState.currentPlayer] = {
          ...currentPlayerData,
          pieces: newPieces,
        }

        const nextPlayer = (gameState.currentPlayer + 1) % gameState.players.length

        await supabase
          .from("ludo_games")
          .update({
            players: updatedPlayers,
            current_player: nextPlayer,
            last_move: `${user.id} moved piece ${pieceIndex + 1}`,
          })
          .eq("id", gameId)

        setSelectedPiece(null)
      } catch (error) {
        console.error("Error moving piece:", error)
        toast.error("Failed to move piece")
      }
    },
    [gameState, user, gameId, supabase, getCurrentPlayerIndex],
  )

  const joinGame = useCallback(async () => {
    if (!user || !profile) return

    try {
      const playerColor = PLAYER_COLORS[gameState?.players.length || 0]
      const newPlayer: Player = {
        id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        color: playerColor,
        pieces: [0, 0, 0, 0],
        isOnline: true,
      }

      const updatedPlayers = [...(gameState?.players || []), newPlayer]

      await supabase
        .from("ludo_games")
        .update({
          players: updatedPlayers,
          game_status: updatedPlayers.length === 4 ? "active" : "waiting",
        })
        .eq("id", gameId)

      toast.success("Joined game successfully!")
    } catch (error) {
      console.error("Error joining game:", error)
      toast.error("Failed to join game")
    }
  }, [user, profile, gameState, gameId, supabase])

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return

    const fetchGame = async () => {
      try {
        const { data, error } = await supabase.from("ludo_games").select("*").eq("id", gameId).single()

        if (error) throw error

        setGameState({
          id: data.id,
          players: data.players || [],
          currentPlayer: data.current_player || 0,
          gameStatus: data.game_status || "waiting",
          winner: data.winner,
          diceValue: data.dice_value || 1,
          lastMove: data.last_move || "",
          created_at: data.created_at,
        })
      } catch (error) {
        console.error("Error fetching game:", error)
        toast.error("Failed to load game")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGame()

    const subscription = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ludo_games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const data = payload.new
          setGameState({
            id: data.id,
            players: data.players || [],
            currentPlayer: data.current_player || 0,
            gameStatus: data.game_status || "waiting",
            winner: data.winner,
            diceValue: data.dice_value || 1,
            lastMove: data.last_move || "",
            created_at: data.created_at,
          })
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [gameId, supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Game not found</p>
      </div>
    )
  }

  const isPlayerInGame = user && gameState.players.some((p) => p.id === user.id)
  const currentPlayerIndex = getCurrentPlayerIndex()
  const isCurrentPlayer = currentPlayerIndex === gameState.currentPlayer
  const DiceIcon = DICE_ICONS[gameState.diceValue as keyof typeof DICE_ICONS]

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ludo Game
            </CardTitle>
            <Badge variant={gameState.gameStatus === "active" ? "default" : "secondary"}>{gameState.gameStatus}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Players ({gameState.players.length}/4)</p>
              <div className="flex flex-wrap gap-2">
                {gameState.players.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{player.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`w-3 h-3 rounded-full bg-${player.color}-500`} />
                    <span className="text-sm">{player.username}</span>
                    {index === gameState.currentPlayer && (
                      <Badge variant="outline" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Game Info</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DiceIcon className="h-6 w-6" />
                  <span className="text-sm">Last Roll: {gameState.diceValue}</span>
                </div>
                {gameState.winner && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Winner: {gameState.winner}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Last Move</p>
              <p className="text-sm text-muted-foreground">{gameState.lastMove || "No moves yet"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Board */}
      <Card>
        <CardContent className="p-6">
          <div className="aspect-square max-w-2xl mx-auto">
            <LudoBoard
              gameState={gameState}
              selectedPiece={selectedPiece}
              onPieceClick={(pieceIndex) => {
                if (isCurrentPlayer && gameState.diceValue > 0) {
                  setSelectedPiece(pieceIndex)
                }
              }}
              onMovePiece={movePiece}
            />
          </div>
        </CardContent>
      </Card>

      {/* Game Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isPlayerInGame && gameState.gameStatus === "waiting" && gameState.players.length < 4 && (
              <Button onClick={joinGame} size="lg">
                Join Game
              </Button>
            )}

            {isPlayerInGame && isCurrentPlayer && gameState.gameStatus === "active" && (
              <Button onClick={rollDice} disabled={diceRolling} size="lg" className="flex items-center gap-2">
                <DiceIcon className="h-5 w-5" />
                {diceRolling ? "Rolling..." : "Roll Dice"}
              </Button>
            )}

            {selectedPiece !== null && isCurrentPlayer && (
              <Button onClick={() => movePiece(selectedPiece)} variant="secondary" size="lg">
                Move Piece {selectedPiece + 1}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simplified Ludo Board Component
function LudoBoard({
  gameState,
  selectedPiece,
  onPieceClick,
  onMovePiece,
}: {
  gameState: GameState
  selectedPiece: number | null
  onPieceClick: (pieceIndex: number) => void
  onMovePiece: (pieceIndex: number) => void
}) {
  return (
    <div className="relative w-full h-full bg-white border-2 border-gray-300 rounded-lg">
      {/* Cross pattern in the center */}
      <div className="absolute inset-0 flex">
        {/* Horizontal bar */}
        <div className="absolute top-1/2 left-0 w-full h-1/6 transform -translate-y-1/2 bg-gray-100 border-y border-gray-300"></div>
        {/* Vertical bar */}
        <div className="absolute left-1/2 top-0 w-1/6 h-full transform -translate-x-1/2 bg-gray-100 border-x border-gray-300"></div>
      </div>

      {/* Player areas */}
      {gameState.players.map((player, playerIndex) => (
        <div key={player.id}>
          {player.pieces.map((position, pieceIndex) => {
            const isSelected = selectedPiece === pieceIndex
            const { x, y } = getPiecePosition(position, player.color, playerIndex)

            return (
              <div
                key={`${player.id}-${pieceIndex}`}
                className={`absolute w-6 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                  isSelected ? "scale-110 ring-2 ring-offset-2 ring-blue-500" : ""
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: getColorValue(player.color),
                  transform: "translate(-50%, -50%)",
                }}
                onClick={() => onPieceClick(pieceIndex)}
              />
            )
          })}
        </div>
      ))}

      {/* Center triangle */}
      <div className="absolute top-1/2 left-1/2 w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 rotate-45 border border-gray-400"></div>
    </div>
  )
}

function getPiecePosition(position: number, color: string, playerIndex: number) {
  // Simplified position calculation - in a real game, this would be more complex
  const basePositions = [
    { x: 20, y: 20 }, // Red corner
    { x: 80, y: 20 }, // Blue corner
    { x: 80, y: 80 }, // Green corner
    { x: 20, y: 80 }, // Yellow corner
  ]

  const base = basePositions[playerIndex]
  const offset = (position % 4) * 8

  return {
    x: base.x + (position > 0 ? offset : 0),
    y: base.y + (position > 0 ? offset : 0),
  }
}

function getColorValue(color: string) {
  const colors = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
  }
  return colors[color as keyof typeof colors] || "#6b7280"
}
