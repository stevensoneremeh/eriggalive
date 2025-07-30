"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Users, Coins, Plus, Play } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface LudoGame {
  id: string
  room_name: string
  entry_fee: number
  prize_pool: number
  max_players: number
  current_players: number
  status: "waiting" | "active" | "finished"
  created_by: string
  created_at: string
}

export default function GamesPage() {
  const { user } = useAuth()
  const [games, setGames] = useState<LudoGame[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [userBalance, setUserBalance] = useState(0)

  useEffect(() => {
    fetchGames()
    if (user) {
      fetchUserBalance()
    }
  }, [user])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from("ludo_games")
        .select("*")
        .eq("status", "waiting")
        .order("created_at", { ascending: false })

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error("Error fetching games:", error)
      toast.error("Failed to load games")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/coins/balance")
      const data = await response.json()
      setUserBalance(data.balance || 0)
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const createGame = async () => {
    if (!user) {
      toast.error("Please sign in to create a game")
      return
    }

    if (userBalance < entryFee) {
      toast.error("Insufficient coins to create this game")
      return
    }

    if (!roomName.trim()) {
      toast.error("Please enter a room name")
      return
    }

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from("ludo_games")
        .insert({
          room_name: roomName.trim(),
          entry_fee: entryFee,
          prize_pool: entryFee,
          max_players: 4,
          current_players: 1,
          status: "waiting",
          created_by: user.id,
          players: [user.id],
          game_state: {
            board: Array(40).fill(null),
            players: {
              [user.id]: {
                color: "red",
                pieces: [0, 0, 0, 0],
                finished: false,
              },
            },
            currentTurn: user.id,
            diceValue: null,
          },
        })
        .select()
        .single()

      if (error) throw error

      // Deduct entry fee from user's balance
      const { error: balanceError } = await supabase
        .from("user_profiles")
        .update({
          erigga_coins: userBalance - entryFee,
        })
        .eq("id", user.id)

      if (balanceError) throw balanceError

      toast.success("Game created successfully!")
      setRoomName("")
      setEntryFee(10)
      fetchGames()
      fetchUserBalance()

      // Redirect to the game
      window.location.href = `/games/ludo/${data.id}`
    } catch (error) {
      console.error("Error creating game:", error)
      toast.error("Failed to create game")
    } finally {
      setCreating(false)
    }
  }

  const joinGame = async (gameId: string, game: LudoGame) => {
    if (!user) {
      toast.error("Please sign in to join a game")
      return
    }

    if (userBalance < game.entry_fee) {
      toast.error("Insufficient coins to join this game")
      return
    }

    try {
      // Check if game is still available
      const { data: currentGame, error: fetchError } = await supabase
        .from("ludo_games")
        .select("*")
        .eq("id", gameId)
        .single()

      if (fetchError) throw fetchError

      if (currentGame.current_players >= currentGame.max_players) {
        toast.error("Game is full")
        return
      }

      if (currentGame.players?.includes(user.id)) {
        toast.error("You are already in this game")
        return
      }

      const colors = ["red", "blue", "green", "yellow"]
      const usedColors = Object.values(currentGame.game_state.players).map((p: any) => p.color)
      const availableColor = colors.find((color) => !usedColors.includes(color))

      // Update game with new player
      const updatedPlayers = [...(currentGame.players || []), user.id]
      const updatedGameState = {
        ...currentGame.game_state,
        players: {
          ...currentGame.game_state.players,
          [user.id]: {
            color: availableColor,
            pieces: [0, 0, 0, 0],
            finished: false,
          },
        },
      }

      const { error: updateError } = await supabase
        .from("ludo_games")
        .update({
          current_players: updatedPlayers.length,
          prize_pool: currentGame.prize_pool + game.entry_fee,
          players: updatedPlayers,
          game_state: updatedGameState,
        })
        .eq("id", gameId)

      if (updateError) throw updateError

      // Deduct entry fee from user's balance
      const { error: balanceError } = await supabase
        .from("user_profiles")
        .update({
          erigga_coins: userBalance - game.entry_fee,
        })
        .eq("id", user.id)

      if (balanceError) throw balanceError

      toast.success("Joined game successfully!")
      fetchUserBalance()

      // Redirect to the game
      window.location.href = `/games/ludo/${gameId}`
    } catch (error) {
      console.error("Error joining game:", error)
      toast.error("Failed to join game")
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground mb-4">Please sign in to play games and compete with other fans</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground">Play Ludo with other fans and win coins!</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{userBalance}</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Game
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Game</DialogTitle>
                <DialogDescription>Create a new Ludo game room for other players to join</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <Label htmlFor="entryFee">Entry Fee (Coins)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="1"
                    max={userBalance}
                    value={entryFee}
                    onChange={(e) => setEntryFee(Number.parseInt(e.target.value) || 1)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Prize pool: {entryFee * 4} coins (winner takes all)
                  </p>
                </div>
                <Button onClick={createGame} disabled={creating || userBalance < entryFee} className="w-full">
                  {creating ? "Creating..." : "Create Game"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No games available</h3>
          <p className="text-muted-foreground mb-4">Be the first to create a game room!</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create First Game</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Game</DialogTitle>
                <DialogDescription>Create a new Ludo game room for other players to join</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <Label htmlFor="entryFee">Entry Fee (Coins)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="1"
                    max={userBalance}
                    value={entryFee}
                    onChange={(e) => setEntryFee(Number.parseInt(e.target.value) || 1)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Prize pool: {entryFee * 4} coins (winner takes all)
                  </p>
                </div>
                <Button onClick={createGame} disabled={creating || userBalance < entryFee} className="w-full">
                  {creating ? "Creating..." : "Create Game"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{game.room_name}</CardTitle>
                  <Badge variant="secondary">
                    {game.current_players}/{game.max_players}
                  </Badge>
                </div>
                <CardDescription>Created {new Date(game.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Entry Fee: {game.entry_fee}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Prize: {game.prize_pool}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => joinGame(game.id, game)}
                    disabled={userBalance < game.entry_fee || game.current_players >= game.max_players}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {game.current_players >= game.max_players ? "Full" : "Join Game"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
