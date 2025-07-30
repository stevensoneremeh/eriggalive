"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Gamepad2, Users, Coins, Plus, Play, Clock } from "lucide-react"
import Link from "next/link"

interface GameRoom {
  id: string
  room_name: string
  entry_fee: number
  prize_pool: number
  max_players: number
  current_players: number
  status: "waiting" | "active" | "finished"
  created_at: string
  host_id: string
  host_username: string
}

export default function GamesPage() {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { user, profile, isAuthenticated } = useAuth()
  const { toast } = useToast()
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
          id,
          room_name,
          entry_fee,
          prize_pool,
          max_players,
          current_players,
          status,
          created_at,
          host_id,
          profiles!ludo_games_host_id_fkey(username)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedRooms =
        data?.map((room) => ({
          ...room,
          host_username: room.profiles?.username || "Unknown",
        })) || []

      setGameRooms(formattedRooms)
    } catch (error) {
      console.error("Error fetching game rooms:", error)
      toast({
        title: "Error",
        description: "Failed to load game rooms",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createGameRoom = async () => {
    if (!isAuthenticated || !user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a game room",
        variant: "destructive",
      })
      return
    }

    if (profile.coins_balance < entryFee) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins to create this room",
        variant: "destructive",
      })
      return
    }

    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter a room name",
        variant: "destructive",
      })
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
          host_id: user.id,
          max_players: 4,
          current_players: 1,
          status: "waiting",
          game_state: {
            board: Array(40).fill(null),
            players: {
              [user.id]: {
                color: "red",
                pieces: [0, 0, 0, 0],
                position: "home",
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
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          coins_balance: profile.coins_balance - entryFee,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      toast({
        title: "Room Created!",
        description: `Game room "${roomName}" has been created successfully`,
      })

      setRoomName("")
      setEntryFee(10)
      setIsDialogOpen(false)

      // Redirect to the game room
      window.location.href = `/games/ludo/${data.id}`
    } catch (error) {
      console.error("Error creating game room:", error)
      toast({
        title: "Error",
        description: "Failed to create game room",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const joinGameRoom = async (roomId: string, entryFee: number) => {
    if (!isAuthenticated || !user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a game",
        variant: "destructive",
      })
      return
    }

    if (profile.coins_balance < entryFee) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins to join this room",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if room is still available
      const { data: roomData, error: roomError } = await supabase
        .from("ludo_games")
        .select("current_players, max_players, status, game_state")
        .eq("id", roomId)
        .single()

      if (roomError) throw roomError

      if (roomData.status !== "waiting") {
        toast({
          title: "Room Unavailable",
          description: "This game room is no longer accepting players",
          variant: "destructive",
        })
        return
      }

      if (roomData.current_players >= roomData.max_players) {
        toast({
          title: "Room Full",
          description: "This game room is already full",
          variant: "destructive",
        })
        return
      }

      // Add player to game
      const colors = ["red", "blue", "green", "yellow"]
      const usedColors = Object.values(roomData.game_state.players).map((p: any) => p.color)
      const availableColor = colors.find((color) => !usedColors.includes(color))

      const updatedGameState = {
        ...roomData.game_state,
        players: {
          ...roomData.game_state.players,
          [user.id]: {
            color: availableColor,
            pieces: [0, 0, 0, 0],
            position: "home",
          },
        },
      }

      const { error: updateError } = await supabase
        .from("ludo_games")
        .update({
          current_players: roomData.current_players + 1,
          prize_pool: (roomData.current_players + 1) * entryFee,
          game_state: updatedGameState,
        })
        .eq("id", roomId)

      if (updateError) throw updateError

      // Deduct entry fee from user's balance
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          coins_balance: profile.coins_balance - entryFee,
        })
        .eq("id", user.id)

      if (balanceError) throw balanceError

      toast({
        title: "Joined Game!",
        description: "You have successfully joined the game room",
      })

      // Redirect to the game room
      window.location.href = `/games/ludo/${roomId}`
    } catch (error) {
      console.error("Error joining game room:", error)
      toast({
        title: "Error",
        description: "Failed to join game room",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground mb-6">Sign in to play games and win coins!</p>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-8 w-8" />
            Games
          </h1>
          <p className="text-muted-foreground mt-2">Play Ludo with other fans and win coins!</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
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
                  placeholder="Enter room name..."
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="entryFee">Entry Fee (Coins)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  min={1}
                  max={profile?.coins_balance || 0}
                />
                <p className="text-sm text-muted-foreground mt-1">Your balance: {profile?.coins_balance || 0} coins</p>
              </div>
              <Button
                onClick={createGameRoom}
                disabled={creating || !roomName.trim() || entryFee > (profile?.coins_balance || 0)}
                className="w-full"
              >
                {creating ? "Creating..." : `Create Room (${entryFee} coins)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          <h3 className="text-lg font-semibold mb-2">No Game Rooms</h3>
          <p className="text-muted-foreground mb-4">Be the first to create a game room and start playing!</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{room.room_name}</CardTitle>
                  <Badge
                    variant={room.status === "waiting" ? "default" : room.status === "active" ? "secondary" : "outline"}
                  >
                    {room.status === "waiting" && <Clock className="h-3 w-3 mr-1" />}
                    {room.status === "active" && <Play className="h-3 w-3 mr-1" />}
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>Hosted by @{room.host_username}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Players
                    </span>
                    <span>
                      {room.current_players}/{room.max_players}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      Entry Fee
                    </span>
                    <span>{room.entry_fee} coins</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      Prize Pool
                    </span>
                    <span className="font-semibold text-yellow-600">{room.prize_pool} coins</span>
                  </div>

                  {room.status === "waiting" && room.current_players < room.max_players ? (
                    <Button
                      onClick={() => joinGameRoom(room.id, room.entry_fee)}
                      className="w-full"
                      disabled={!profile || profile.coins_balance < room.entry_fee}
                    >
                      Join Game ({room.entry_fee} coins)
                    </Button>
                  ) : room.status === "active" ? (
                    <Button asChild className="w-full">
                      <Link href={`/games/ludo/${room.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Watch Game
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Game {room.status}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
