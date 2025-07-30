"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Gamepad2, Users, Coins, Plus, Play, Clock, Trophy, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface GameRoom {
  id: string
  room_name: string
  entry_fee: number
  max_players: number
  current_players: number
  status: "waiting" | "active" | "finished"
  created_by: string
  created_at: string
  creator_username?: string
}

export default function GamesPage() {
  const { user, profile, isAuthenticated } = useAuth()
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchGameRooms()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("game-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "ludo_games" }, () => {
        fetchGameRooms()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchGameRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("ludo_games")
        .select(`
          *,
          profiles!ludo_games_created_by_fkey(username)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const rooms =
        data?.map((room) => ({
          ...room,
          creator_username: room.profiles?.username,
          current_players: room.players ? Object.keys(room.players).length : 0,
        })) || []

      setGameRooms(rooms)
    } catch (error) {
      console.error("Error fetching game rooms:", error)
      toast.error("Failed to load game rooms")
    } finally {
      setLoading(false)
    }
  }

  const createGameRoom = async () => {
    if (!isAuthenticated || !user || !profile) {
      toast.error("Please sign in to create a game room")
      return
    }

    if (!roomName.trim()) {
      toast.error("Please enter a room name")
      return
    }

    if (profile.coins_balance < entryFee) {
      toast.error("Insufficient coins to create this room")
      return
    }

    setCreating(true)

    try {
      const { data, error } = await supabase
        .from("ludo_games")
        .insert({
          room_name: roomName.trim(),
          entry_fee: entryFee,
          created_by: user.id,
          players: {
            [user.id]: {
              username: profile.username,
              position: 0,
              pieces: [0, 0, 0, 0],
              color: "red",
            },
          },
          current_player: user.id,
          status: "waiting",
        })
        .select()
        .single()

      if (error) throw error

      // Deduct entry fee from user's balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          coins_balance: profile.coins_balance - entryFee,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      toast.success("Game room created successfully!")
      setIsCreateDialogOpen(false)
      setRoomName("")
      setEntryFee(10)

      // Navigate to the game room
      router.push(`/games/ludo/${data.id}`)
    } catch (error) {
      console.error("Error creating game room:", error)
      toast.error("Failed to create game room")
    } finally {
      setCreating(false)
    }
  }

  const joinGameRoom = async (roomId: string, room: GameRoom) => {
    if (!isAuthenticated || !user || !profile) {
      toast.error("Please sign in to join a game")
      return
    }

    if (profile.coins_balance < room.entry_fee) {
      toast.error("Insufficient coins to join this game")
      return
    }

    if (room.current_players >= room.max_players) {
      toast.error("This game room is full")
      return
    }

    try {
      // Get current game data
      const { data: gameData, error: fetchError } = await supabase
        .from("ludo_games")
        .select("players")
        .eq("id", roomId)
        .single()

      if (fetchError) throw fetchError

      const players = gameData.players || {}

      if (players[user.id]) {
        // User already in game, just navigate
        router.push(`/games/ludo/${roomId}`)
        return
      }

      // Add player to game
      const colors = ["red", "blue", "green", "yellow"]
      const usedColors = Object.values(players).map((p: any) => p.color)
      const availableColor = colors.find((color) => !usedColors.includes(color)) || "red"

      players[user.id] = {
        username: profile.username,
        position: 0,
        pieces: [0, 0, 0, 0],
        color: availableColor,
      }

      const { error: updateError } = await supabase.from("ludo_games").update({ players }).eq("id", roomId)

      if (updateError) throw updateError

      // Deduct entry fee
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          coins_balance: profile.coins_balance - room.entry_fee,
        })
        .eq("id", user.id)

      if (balanceError) throw balanceError

      toast.success("Joined game successfully!")
      router.push(`/games/ludo/${roomId}`)
    } catch (error) {
      console.error("Error joining game:", error)
      toast.error("Failed to join game")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Gamepad2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground mb-6">Sign in to play games and compete with other fans</p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-8 w-8" />
            Games
          </h1>
          <p className="text-muted-foreground">Play Ludo with other fans and win coins</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Game Room</DialogTitle>
              <DialogDescription>
                Create a new Ludo game room. Entry fee will be deducted from your coin balance.
              </DialogDescription>
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
                  max="1000"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number.parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Your Balance:</span>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span>{profile?.coins_balance || 0}</span>
                </div>
              </div>
              <Button onClick={createGameRoom} disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Room"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Rooms</p>
                <p className="text-2xl font-bold">{gameRooms.filter((room) => room.status === "waiting").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Games Playing</p>
                <p className="text-2xl font-bold">{gameRooms.filter((room) => room.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold">{profile?.coins_balance || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Rooms */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Rooms</h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : gameRooms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No game rooms available</h3>
              <p className="text-muted-foreground mb-4">Be the first to create a game room and start playing!</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameRooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{room.room_name}</CardTitle>
                    <Badge
                      variant={
                        room.status === "waiting" ? "default" : room.status === "active" ? "secondary" : "outline"
                      }
                    >
                      {room.status === "waiting" ? "Waiting" : room.status === "active" ? "Playing" : "Finished"}
                    </Badge>
                  </div>
                  <CardDescription>Created by @{room.creator_username}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {room.current_players}/{room.max_players} players
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span>{room.entry_fee} coins</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(room.created_at).toLocaleTimeString()}</span>
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>Prize: {room.entry_fee * room.current_players} coins</span>
                    </div>

                    {room.status === "waiting" ? (
                      <Button
                        onClick={() => joinGameRoom(room.id, room)}
                        className="w-full"
                        disabled={room.current_players >= room.max_players}
                      >
                        {room.current_players >= room.max_players ? "Room Full" : "Join Game"}
                      </Button>
                    ) : room.status === "active" ? (
                      <Button variant="outline" className="w-full bg-transparent" asChild>
                        <Link href={`/games/ludo/${room.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Watch Game
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full bg-transparent" disabled>
                        Game Finished
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
