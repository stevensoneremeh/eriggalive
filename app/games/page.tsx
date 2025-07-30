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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Gamepad2, Users, Coins, Plus, Play } from "lucide-react"
import Link from "next/link"

interface GameRoom {
  id: string
  name: string
  entry_fee: number
  max_players: number
  current_players: number
  status: "waiting" | "active" | "finished"
  created_by: string
  created_at: string
}

export default function GamesPage() {
  const { user, profile, isAuthenticated } = useAuth()
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(100)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchGameRooms()
  }, [])

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
      } else {
        setGameRooms(data || [])
      }
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
          name: roomName.trim(),
          entry_fee: entryFee,
          max_players: 4,
          current_players: 1,
          status: "waiting",
          created_by: user.id,
          players: [
            {
              id: user.id,
              username: profile.username,
              color: "red",
              position: 0,
              pieces: [0, 0, 0, 0],
            },
          ],
          game_state: {
            board: Array(52).fill(null),
            currentPlayer: 0,
            diceValue: 0,
            winner: null,
          },
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating game room:", error)
        toast.error("Failed to create game room")
      } else {
        toast.success("Game room created successfully!")
        setRoomName("")
        setEntryFee(100)
        setIsDialogOpen(false)
        fetchGameRooms()

        // Redirect to the game room
        window.location.href = `/games/ludo/${data.id}`
      }
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

    try {
      // Add player to the game
      const colors = ["red", "blue", "green", "yellow"]
      const playerColor = colors[room.current_players]

      const { error } = await supabase
        .from("ludo_games")
        .update({
          current_players: room.current_players + 1,
          players: [
            ...room.players,
            {
              id: user.id,
              username: profile.username,
              color: playerColor,
              position: room.current_players,
              pieces: [0, 0, 0, 0],
            },
          ],
        })
        .eq("id", roomId)

      if (error) {
        console.error("Error joining game:", error)
        toast.error("Failed to join game")
      } else {
        toast.success("Joined game successfully!")
        window.location.href = `/games/ludo/${roomId}`
      }
    } catch (error) {
      console.error("Error joining game:", error)
      toast.error("Failed to join game")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground mb-6">Sign in to play games and compete with other fans!</p>
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
          <h1 className="text-3xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground">Play Ludo with other fans and win coins!</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
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
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  min={10}
                  max={profile?.coins_balance || 0}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your balance: {profile?.coins_balance?.toLocaleString() || 0} coins
                </p>
              </div>
              <Button onClick={createGameRoom} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {profile && (
        <div className="mb-6">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{profile.coins_balance?.toLocaleString() || 0} Coins</span>
                </div>
              </div>
              <Link href="/coins">
                <Button variant="outline" size="sm">
                  Buy Coins
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : gameRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Game Rooms Available</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a game room!</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          </div>
        ) : (
          gameRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{room.name}</span>
                  <Badge variant={room.status === "waiting" ? "secondary" : "default"}>{room.status}</Badge>
                </CardTitle>
                <CardDescription>Created {new Date(room.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {room.current_players}/{room.max_players} players
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold">{room.entry_fee} coins</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Prize Pool: {room.entry_fee * room.current_players} coins
                  </div>

                  {room.status === "waiting" ? (
                    <Button
                      onClick={() => joinGameRoom(room.id, room)}
                      className="w-full"
                      disabled={room.current_players >= room.max_players}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {room.current_players >= room.max_players ? "Room Full" : "Join Game"}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full bg-transparent" disabled>
                      Game in Progress
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
