"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Gamepad2, Users, Coins, Plus, Play, Clock, Trophy } from "lucide-react"
import Link from "next/link"

interface GameRoom {
  id: string
  name: string
  entry_fee: number
  max_players: number
  current_players: number
  status: string
  created_by: string
  created_at: string
  prize_pool?: number
  players?: string[]
}

export default function GamesPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("ludo_games")
        .select("*")
        .eq("status", "waiting")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching rooms:", error)
        return
      }

      setRooms(data || [])
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const createRoom = async () => {
    if (!user || !profile) {
      toast.error("Please sign in to create a game room")
      return
    }

    if (profile.coins_balance < entryFee) {
      toast.error("Insufficient coins to create this room")
      return
    }

    if (!roomName.trim()) {
      toast.error("Please enter a room name")
      return
    }

    setIsCreating(true)

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
          players: [user.id],
          prize_pool: entryFee,
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
        console.error("Error creating room:", error)
        toast.error("Failed to create room")
        return
      }

      // Deduct entry fee from user's balance
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ coins_balance: profile.coins_balance - entryFee })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating balance:", updateError)
      }

      toast.success("Room created successfully!")
      setRoomName("")
      setEntryFee(10)
      setShowCreateForm(false)
      fetchRooms()
      router.push(`/games/ludo/${data.id}`)
    } catch (error) {
      console.error("Error creating room:", error)
      toast.error("Failed to create room")
    } finally {
      setIsCreating(false)
    }
  }

  const joinRoom = async (room: GameRoom) => {
    if (!user || !profile) {
      toast.error("Please sign in to join a game")
      return
    }

    if (profile.coins_balance < room.entry_fee) {
      toast.error("Insufficient coins to join this room")
      return
    }

    if (room.current_players >= room.max_players) {
      toast.error("Room is full")
      return
    }

    try {
      const { error } = await supabase
        .from("ludo_games")
        .update({
          current_players: room.current_players + 1,
          players: [...(room.players || []), user.id],
          prize_pool: (room.prize_pool || 0) + room.entry_fee,
        })
        .eq("id", room.id)

      if (error) {
        console.error("Error joining room:", error)
        toast.error("Failed to join room")
        return
      }

      // Deduct entry fee from user's balance
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ coins_balance: profile.coins_balance - room.entry_fee })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating balance:", updateError)
      }

      toast.success("Joined room successfully!")
      router.push(`/games/ludo/${room.id}`)
    } catch (error) {
      console.error("Error joining room:", error)
      toast.error("Failed to join room")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-8 w-8" />
            Games
          </h1>
          <p className="text-muted-foreground">Play Ludo and compete for coin prizes!</p>
        </div>
        <div className="flex items-center gap-4">
          {profile && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Coins className="mr-2 h-4 w-4" />
              {profile.coins_balance?.toLocaleString() || 0} Coins
            </Badge>
          )}
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Room
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Room
            </CardTitle>
            <CardDescription>Start a new Ludo game and invite others to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="Enter room name..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
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
              <p className="text-sm text-muted-foreground mt-1">
                Your balance: {profile?.coins_balance?.toLocaleString() || 0} coins
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={createRoom} disabled={isCreating || !roomName.trim()} className="flex-1">
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Available Rooms</h2>

        {loadingRooms ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Game Rooms Available</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a game room!</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{room.name}</span>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {room.current_players}/{room.max_players}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {new Date(room.created_at).toLocaleDateString()}
                  </CardDescription>
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
                        <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                        <span className="font-medium">{room.prize_pool || room.entry_fee * room.current_players}</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      {room.current_players >= room.max_players ? (
                        <Button disabled className="w-full">
                          Room Full
                        </Button>
                      ) : (
                        <Button onClick={() => joinRoom(room)} className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Join Game ({room.entry_fee} coins)
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
    </div>
  )
}
