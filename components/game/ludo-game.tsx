"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Coins, Crown, Play } from "lucide-react"

interface GameState {
  board: (string | null)[]
  players: {
    [playerId: string]: {
      color: string
      pieces: number[]
      position: string
    }
  }
  currentTurn: string
  diceValue: number | null
  winner?: string
}

interface LudoGameProps {
  gameId: string
  initialGameState: GameState
  roomName: string
  prizePool: number
  players: any[]
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

const BOARD_POSITIONS = {
  // Home positions for each color
  red: [1, 2, 3, 4],
  blue: [11, 12, 13, 14],
  green: [21, 22, 23, 24],
  yellow: [31, 32, 33, 34],
  // Safe positions
  safe: [9, 14, 22, 27, 35, 40, 48, 1],
}

export function LudoGame({ gameId, initialGameState, roomName, prizePool, players }: LudoGameProps) {
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [rolling, setRolling] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const currentPlayer = gameState.players[user?.id || ""]
  const isMyTurn = gameState.currentTurn === user?.id
  const DiceIcon = gameState.diceValue ? DICE_ICONS[gameState.diceValue as keyof typeof DICE_ICONS] : Dice1

  useEffect(() => {
    // Subscribe to real-time game updates
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
  }, [gameId])

  const rollDice = async () => {
    if (!isMyTurn || rolling || !user) return

    setRolling(true)

    // Animate dice roll
    const rollAnimation = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        diceValue: Math.floor(Math.random() * 6) + 1,
      }))
    }, 100)

    setTimeout(async () => {
      clearInterval(rollAnimation)

      const finalDiceValue = Math.floor(Math.random() * 6) + 1

      const updatedGameState = {
        ...gameState,
        diceValue: finalDiceValue,
      }

      try {
        const { error } = await supabase.from("ludo_games").update({ game_state: updatedGameState }).eq("id", gameId)

        if (error) throw error

        setGameState(updatedGameState)

        toast({
          title: "Dice Rolled!",
          description: `You rolled a ${finalDiceValue}`,
        })
      } catch (error) {
        console.error("Error updating dice roll:", error)
        toast({
          title: "Error",
          description: "Failed to roll dice",
          variant: "destructive",
        })
      } finally {
        setRolling(false)
      }
    }, 1000)
  }

  const movePiece = async (pieceIndex: number) => {
    if (!isMyTurn || !gameState.diceValue || !user || !currentPlayer) return

    const currentPosition = currentPlayer.pieces[pieceIndex]
    const newPosition = currentPosition + gameState.diceValue

    // Basic move validation (simplified)
    if (newPosition > 56) return // Can't move past finish

    const updatedPlayers = {
      ...gameState.players,
      [user.id]: {
        ...currentPlayer,
        pieces: currentPlayer.pieces.map((pos, idx) => (idx === pieceIndex ? newPosition : pos)),
      },
    }

    // Check for winner (simplified - if any piece reaches position 56)
    const hasWon = updatedPlayers[user.id].pieces.some((pos) => pos >= 56)

    // Get next player
    const playerIds = Object.keys(gameState.players)
    const currentIndex = playerIds.indexOf(user.id)
    const nextIndex = (currentIndex + 1) % playerIds.length
    const nextPlayer = playerIds[nextIndex]

    const updatedGameState: GameState = {
      ...gameState,
      players: updatedPlayers,
      currentTurn: hasWon ? user.id : gameState.diceValue === 6 ? user.id : nextPlayer,
      diceValue: null,
      winner: hasWon ? user.id : undefined,
    }

    try {
      const updateData: any = {
        game_state: updatedGameState,
      }

      if (hasWon) {
        updateData.status = "finished"
        updateData.winner_id = user.id

        // Award prize to winner
        const { error: prizeError } = await supabase
          .from("profiles")
          .update({
            coins_balance: (profile?.coins_balance || 0) + prizePool,
          })
          .eq("id", user.id)

        if (prizeError) throw prizeError
      }

      const { error } = await supabase.from("ludo_games").update(updateData).eq("id", gameId)

      if (error) throw error

      setGameState(updatedGameState)
      setSelectedPiece(null)

      if (hasWon) {
        toast({
          title: "🎉 Congratulations!",
          description: `You won ${prizePool} coins!`,
        })
      } else {
        toast({
          title: "Piece Moved!",
          description: `Moved piece ${pieceIndex + 1} to position ${newPosition}`,
        })
      }
    } catch (error) {
      console.error("Error moving piece:", error)
      toast({
        title: "Error",
        description: "Failed to move piece",
        variant: "destructive",
      })
    }
  }

  const startGame = async () => {
    if (!user) return

    try {
      const { error } = await supabase.from("ludo_games").update({ status: "active" }).eq("id", gameId)

      if (error) throw error

      toast({
        title: "Game Started!",
        description: "The game has begun. Good luck!",
      })
    } catch (error) {
      console.error("Error starting game:", error)
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      })
    }
  }

  if (gameState.winner) {
    const winner = players.find((p) => p.id === gameState.winner)
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <Crown className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <CardTitle className="text-2xl">Game Over!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">
              🎉 <strong>@{winner?.username || "Unknown"}</strong> wins!
            </p>
            <div className="flex items-center justify-center gap-2 text-yellow-600">
              <Coins className="h-5 w-5" />
              <span className="font-semibold">{prizePool} coins</span>
            </div>
            <Button className="mt-6" onClick={() => (window.location.href = "/games")}>
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{roomName}</CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    {prizePool} coins
                  </Badge>
                  {players.length < 4 && (
                    <Button onClick={startGame} size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Start Game
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Simplified Ludo Board */}
              <div className="aspect-square max-w-lg mx-auto bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg p-4 relative">
                {/* Center area */}
                <div className="absolute inset-1/3 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="font-bold text-lg">LUDO</h3>
                    <p className="text-sm text-muted-foreground">Home</p>
                  </div>
                </div>

                {/* Player home areas */}
                {Object.entries(gameState.players).map(([playerId, player]) => {
                  const playerInfo = players.find((p) => p.id === playerId)
                  const colorClass = COLORS[player.color as keyof typeof COLORS]

                  return (
                    <div
                      key={playerId}
                      className={`absolute w-20 h-20 ${colorClass} rounded-lg opacity-80 flex flex-col items-center justify-center text-white text-xs`}
                      style={{
                        top: player.color === "red" ? "10px" : player.color === "blue" ? "10px" : "auto",
                        bottom: player.color === "green" ? "10px" : player.color === "yellow" ? "10px" : "auto",
                        left: player.color === "red" ? "10px" : player.color === "yellow" ? "10px" : "auto",
                        right: player.color === "blue" ? "10px" : player.color === "green" ? "10px" : "auto",
                      }}
                    >
                      <div className="font-semibold">@{playerInfo?.username}</div>
                      <div className="flex gap-1 mt-1">
                        {player.pieces.map((position, idx) => (
                          <button
                            key={idx}
                            onClick={() => isMyTurn && gameState.diceValue && playerId === user?.id && movePiece(idx)}
                            className={`w-3 h-3 rounded-full border-2 border-white ${
                              selectedPiece === idx ? "ring-2 ring-yellow-400" : ""
                            } ${
                              isMyTurn && gameState.diceValue && playerId === user?.id
                                ? "cursor-pointer hover:scale-110 transition-transform"
                                : ""
                            }`}
                            style={{
                              backgroundColor: position > 0 ? "#fff" : "rgba(255,255,255,0.5)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Controls */}
        <div className="space-y-6">
          {/* Current Turn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Turn</CardTitle>
            </CardHeader>
            <CardContent>
              {isMyTurn ? (
                <div className="text-center">
                  <Badge className="mb-4">Your Turn</Badge>
                  <div className="space-y-4">
                    <Button onClick={rollDice} disabled={rolling || !!gameState.diceValue} className="w-full" size="lg">
                      <DiceIcon className="h-6 w-6 mr-2" />
                      {rolling ? "Rolling..." : gameState.diceValue ? `Rolled ${gameState.diceValue}` : "Roll Dice"}
                    </Button>
                    {gameState.diceValue && (
                      <p className="text-sm text-muted-foreground">
                        Click on a piece to move it {gameState.diceValue} spaces
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    Waiting
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {players.find((p) => p.id === gameState.currentTurn)?.username || "Unknown"}'s turn
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({players.length}/4)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.map((player) => {
                  const gamePlayer = gameState.players[player.id]
                  const colorClass = gamePlayer ? COLORS[gamePlayer.color as keyof typeof COLORS] : "bg-gray-400"

                  return (
                    <div key={player.id} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colorClass}`} />
                      <div className="flex-1">
                        <div className="font-medium">@{player.username}</div>
                        {gameState.currentTurn === player.id && (
                          <Badge variant="outline" className="text-xs">
                            Current Turn
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
                {players.length < 4 && (
                  <div className="text-center py-4 border-2 border-dashed border-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Waiting for more players...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Prize Pool:</span>
                <span className="font-semibold text-yellow-600">{prizePool} coins</span>
              </div>
              <div className="flex justify-between">
                <span>Players:</span>
                <span>{players.length}/4</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
