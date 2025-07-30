"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Users, Coins, Plus, Play } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

interface GameRoom {
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
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchGameRooms()
  }, [mounted])

  const fetchGameRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("ludo_games")
        .select("*")
        .eq("status", "waiting")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching game rooms:", error)
        toast.error("Failed to load game rooms")
        return
      }

      setGameRooms(data || [])
    } catch (error) {
      console.error("Error in fetchGameRooms:", error)
      toast.error("Failed to load game rooms")
    } finally {
      setLoading(false)
    }
  }

  const createGameRoom = async () => {
    if (!user) {
      toast.error("Please sign in to create a game room")
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
            board: Array(52).fill(null),
            currentPlayer: 0,
            diceValue: 1,
            playerPositions: {
              [user.id]: { pieces: [0, 0, 0, 0], color: "red" },
            },
          },
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating game room:", error)
        toast.error("Failed to create game room")
        return
      }

      toast.success("Game room created successfully!")
      setShowCreateForm(false)
      setRoomName("")
      setEntryFee(10)
      fetchGameRooms()
    } catch (error) {
      console.error("Error in createGameRoom:", error)
      toast.error("Failed to create game room")
    } finally {
      setCreating(false)
    }
  }

  const joinGameRoom = async (roomId: string, currentEntryFee: number) => {
    if (!user) {
      toast.error("Please sign in to join a game")
      return
    }

    try {
      // First, get the current game state
      const { data: gameData, error: fetchError } = await supabase
        .from("ludo_games")
        .select("*")
        .eq("id", roomId)
        .single()

      if (fetchError || !gameData) {
        toast.error("Game room not found")
        return
      }

      if (gameData.current_players >= gameData.max_players) {
        toast.error("Game room is full")
        return
      }

      if (gameData.players.includes(user.id)) {
        toast.error("You are already in this game")
        return
      }

      // Update the game with new player
      const updatedPlayers = [...gameData.players, user.id]
      const colors = ["red", "blue", "green", "yellow"]
      const playerColor = colors[gameData.current_players]

      const updatedGameState = {
        ...gameData.game_state,
        playerPositions: {
          ...gameData.game_state.playerPositions,
          [user.id]: { pieces: [0, 0, 0, 0], color: playerColor },
        },
      }

      const { error: updateError } = await supabase
        .from("ludo_games")
        .update({
          players: updatedPlayers,
          current_players: gameData.current_players + 1,
          prize_pool: gameData.prize_pool + currentEntryFee,
          game_state: updatedGameState,
        })
        .eq("id", roomId)

      if (updateError) {
        console.error("Error joining game:", updateError)
        toast.error("Failed to join game")
        return
      }

      toast.success("Successfully joined the game!")
      fetchGameRooms()
    } catch (error) {
      console.error("Error in joinGameRoom:", error)
      toast.error("Failed to join game")
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96 mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground mb-6">Please sign in to play games and compete with other fans</p>
          <div className="space-x-4">
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-8 w-8" />
            Games
          </h1>
          <p className="text-muted-foreground mt-2">Play Ludo with other fans and win coins!</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Game Room</CardTitle>
            <CardDescription>Set up a new Ludo game room for other players to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="entryFee">Entry Fee (Coins)</Label>
              <Input
                id="entryFee"
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                min="1"
                max="1000"
                className="mt-1"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={createGameRoom} disabled={creating}>
                {creating ? "Creating..." : "Create Room"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : gameRooms.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Game Rooms Available</h3>
          <p className="text-muted-foreground mb-4">Be the first to create a game room and start playing!</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Room
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gameRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{room.room_name}</span>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {room.current_players}/{room.max_players}
                  </Badge>
                </CardTitle>
                <CardDescription>Created {new Date(room.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Entry Fee:</span>
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                      <span className="font-medium">{room.entry_fee}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prize Pool:</span>
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                      <span className="font-medium">{room.prize_pool}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    {room.current_players >= room.max_players ? (
                      <Button disabled className="w-full">
                        Room Full
                      </Button>
                    ) : (
                      <Button onClick={() => joinGameRoom(room.id, room.entry_fee)} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Join Game
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
