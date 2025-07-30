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
import { Gamepad2, Users, Coins, Plus, Play } from "lucide-react"

interface GameRoom {
  id: string
  name: string
  entry_fee: number
  max_players: number
  current_players: number
  status: string
  created_by: string
  created_at: string
}

export default function GamesPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [loadingRooms, setLoadingRooms] = useState(true)

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
          <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground mb-4">Sign in to play games and compete with other fans!</p>
          <Button onClick={() => router.push("/login")}>Sign In</Button>
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
        {profile && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Coins className="mr-2 h-4 w-4" />
            {profile.coins_balance?.toLocaleString() || 0} Coins
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Room Card */}
        <Card>
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
            </div>
            <Button onClick={createRoom} disabled={isCreating || !roomName.trim()} className="w-full">
              {isCreating ? "Creating..." : "Create Room"}
            </Button>
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Rooms
            </CardTitle>
            <CardDescription>Join an existing game room</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRooms ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rooms available. Create one to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{room.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.current_players}/{room.max_players}
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {room.entry_fee}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinRoom(room)}
                      disabled={room.current_players >= room.max_players}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
