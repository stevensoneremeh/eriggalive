"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Coins, Trophy, Clock, Play, Loader2 } from "lucide-react"

interface GameState {
  id: string
  room_name: string
  entry_fee: number
  players: Record<string, Player>
  current_player: string
  dice_value: number
  status: "waiting" | "active" | "finished"
  winner?: string
  board_state: number[][]
  created_at: string
}

interface Player {
  username: string
  color: "red" | "blue" | "green" | "yellow"
  pieces: number[]
  position: number
}

interface LudoGameProps {
  gameId: string
}

const DICE_ICONS = {
  1: Dice1,
  2: Dice2,
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6,
}

const COLORS = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
}

export function LudoGame({ gameId }: LudoGameProps) {
  const { user, profile } = useAuth()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const supabase = createClient()

  const fetchGameState = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("ludo_games").select("*").eq("id", gameId).single()

      if (error) throw error
      setGameState(data)
    } catch (error) {
      console.error("Error fetching game state:", error)
      toast.error("Failed to load game")
    } finally {
      setLoading(false)
    }
  }, [gameId, supabase])

  useEffect(() => {
    fetchGameState()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ludo_games", filter: `id=eq.${gameId}` },
        (payload) => {
          setGameState(payload.new as GameState)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, fetchGameState, supabase])

  const rollDice = async () => {
    if (!user || !gameState || gameState.current_player !== user.id || rolling) {
      return
    }

    setRolling(true)

    try {
      const diceValue = Math.floor(Math.random() * 6) + 1

      const { error } = await supabase
        .from("ludo_games")
        .update({
          dice_value: diceValue,
          // Don't change turn yet - wait for piece movement
        })
        .eq("id", gameId)

      if (error) throw error

      toast.success(`Rolled a ${diceValue}!`)
    } catch (error) {
      console.error("Error rolling dice:", error)
      toast.error("Failed to roll dice")
    } finally {
      setRolling(false)
    }
  }

  const movePiece = async (pieceIndex: number) => {
    if (!user || !gameState || gameState.current_player !== user.id) {
      return
    }

    const currentPlayer = gameState.players[user.id]
    if (!currentPlayer) return

    try {
      const newPieces = [...currentPlayer.pieces]
      newPieces[pieceIndex] += gameState.dice_value

      // Simple validation - pieces can't go beyond 57 (home)
      if (newPieces[pieceIndex] > 57) {
        toast.error("Invalid move - piece would go beyond home")
        return
      }

      const updatedPlayers = {
        ...gameState.players,
        [user.id]: {
          ...currentPlayer,
          pieces: newPieces,
        },
      }

      // Determine next player
      const playerIds = Object.keys(gameState.players)
      const currentIndex = playerIds.indexOf(user.id)
      const nextIndex = (currentIndex + 1) % playerIds.length
      const nextPlayer = playerIds[nextIndex]

      // Check for win condition (all pieces at position 57)
      const hasWon = newPieces.every((piece) => piece === 57)
      const newStatus = hasWon ? "finished" : gameState.status

      const { error } = await supabase
        .from("ludo_games")
        .update({
          players: updatedPlayers,
          current_player: hasWon ? gameState.current_player : nextPlayer,
          status: newStatus,
          winner: hasWon ? user.id : gameState.winner,
          dice_value: 0, // Reset dice after move
        })
        .eq("id", gameId)

      if (error) throw error

      if (hasWon) {
        toast.success("Congratulations! You won the game!")
        // Award prize money
        const totalPrize = gameState.entry_fee * Object.keys(gameState.players).length
        await supabase
          .from("profiles")
          .update({
            coins_balance: (profile?.coins_balance || 0) + totalPrize,
          })
          .eq("id", user.id)
      }

      setSelectedPiece(null)
    } catch (error) {
      console.error("Error moving piece:", error)
      toast.error("Failed to move piece")
    }
  }

  const startGame = async () => {
    if (!user || !gameState || gameState.created_by !== user.id) {
      return
    }

    try {
      const { error } = await supabase.from("ludo_games").update({ status: "active" }).eq("id", gameId)

      if (error) throw error
      toast.success("Game started!")
    } catch (error) {
      console.error("Error starting game:", error)
      toast.error("Failed to start game")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Game not found</h2>
            <p className="text-muted-foreground">This game room doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const playerList = Object.entries(gameState.players)
  const currentPlayerData = user ? gameState.players[user.id] : null
  const isCurrentTurn = user && gameState.current_player === user.id
  const canRoll = isCurrentTurn && gameState.dice_value === 0 && gameState.status === "active"
  const canMove = isCurrentTurn && gameState.dice_value > 0 && gameState.status === "active"

  const DiceIcon = DICE_ICONS[gameState.dice_value as keyof typeof DICE_ICONS] || Dice1

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Game Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-6 w-6" />
              {gameState.room_name}
            </CardTitle>
            <Badge
              variant={
                gameState.status === "waiting" ? "default" : gameState.status === "active" ? "secondary" : "outline"
              }
            >
              {gameState.status === "waiting"
                ? "Waiting for Players"
                : gameState.status === "active"
                  ? "Game Active"
                  : "Game Finished"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{playerList.length}/4 Players</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>Entry: {gameState.entry_fee} coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>Prize: {gameState.entry_fee * playerList.length} coins</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Controls */}
      {gameState.status === "waiting" && (
        <Card className="mb-6">
          <CardContent className="text-center py-6">
            <h3 className="text-lg font-semibold mb-2">Waiting for Players</h3>
            <p className="text-muted-foreground mb-4">Need {4 - playerList.length} more players to start the game</p>
            {user && gameState.created_by === user.id && playerList.length >= 2 && (
              <Button onClick={startGame}>Start Game ({playerList.length} players)</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {playerList.map(([playerId, player]) => (
              <div
                key={playerId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  gameState.current_player === playerId ? "bg-primary/10 border-primary" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${COLORS[player.color]}`} />
                  <span className="font-medium">@{player.username}</span>
                  {gameState.current_player === playerId && (
                    <Badge variant="secondary" className="text-xs">
                      Current Turn
                    </Badge>
                  )}
                </div>
                {gameState.winner === playerId && <Trophy className="h-4 w-4 text-yellow-500" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Game Board */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Game Board</CardTitle>
          </CardHeader>
          <CardContent>
            {gameState.status === "active" && (
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <DiceIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {gameState.dice_value > 0 ? `Rolled: ${gameState.dice_value}` : "Roll the dice"}
                    </p>
                  </div>
                </div>

                {canRoll && (
                  <Button onClick={rollDice} disabled={rolling} size="lg">
                    {rolling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rolling...
                      </>
                    ) : (
                      "Roll Dice"
                    )}
                  </Button>
                )}

                {isCurrentTurn && !canRoll && !canMove && (
                  <p className="text-muted-foreground">Waiting for your move...</p>
                )}

                {!isCurrentTurn && gameState.status === "active" && (
                  <p className="text-muted-foreground">
                    Waiting for @{gameState.players[gameState.current_player]?.username}'s turn
                  </p>
                )}
              </div>
            )}

            {/* Simple Board Representation */}
            <div className="bg-muted/20 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {playerList.map(([playerId, player]) => (
                    <div key={playerId} className="text-center">
                      <div className={`w-8 h-8 rounded-full ${COLORS[player.color]} mx-auto mb-2`} />
                      <p className="text-sm font-medium">@{player.username}</p>
                      <div className="flex gap-1 justify-center mt-1">
                        {player.pieces.map((position, index) => (
                          <button
                            key={index}
                            onClick={() => (canMove ? movePiece(index) : null)}
                            className={`w-6 h-6 rounded-full text-xs font-bold ${COLORS[player.color]} ${
                              canMove && playerId === user?.id ? "hover:opacity-80 cursor-pointer" : ""
                            } ${selectedPiece === index ? "ring-2 ring-white" : ""}`}
                            disabled={!canMove || playerId !== user?.id}
                          >
                            {position}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {gameState.status === "finished" && gameState.winner && (
                  <div className="text-center">
                    <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
                    <h3 className="text-xl font-bold mb-2">Game Finished!</h3>
                    <p className="text-lg">🎉 @{gameState.players[gameState.winner]?.username} wins!</p>
                    <p className="text-muted-foreground">Prize: {gameState.entry_fee * playerList.length} coins</p>
                  </div>
                )}

                {gameState.status === "waiting" && (
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2" />
                    <p>Waiting for more players to join...</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
