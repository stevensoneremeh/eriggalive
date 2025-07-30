"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Play, Trophy, Search, Gamepad2, Crown, Coins } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

interface GameRoom {
  id: string
  name: string
  creator_id: string
  creator_username: string
  players: any[]
  max_players: number
  game_status: "waiting" | "active" | "finished"
  entry_fee: number
  prize_pool: number
  created_at: string
}

export function GameLobby() {
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [isCreating, setIsCreating] = useState(false)

  const { user, profile } = useAuth()
  const supabase = createClient()

  const fetchRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("ludo_games").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setRooms(data || [])
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast.error("Failed to load game rooms")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const createRoom = useCallback(async () => {
    if (!user || !profile || !roomName.trim()) {
      toast.error("Please enter a room name")
      return
    }

    if (profile.coins_balance < entryFee) {
      toast.error("Insufficient coins to create this room")
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase
        .from("ludo_games")
        .insert({
          name: roomName.trim(),
          creator_id: user.id,
          creator_username: profile.username,
          players: [
            {
              id: user.id,
              username: profile.username,
              avatar_url: profile.avatar_url,
              color: "red",
              pieces: [0, 0, 0, 0],
              isOnline: true,
            },
          ],
          max_players: 4,
          game_status: "waiting",
          entry_fee: entryFee,
          prize_pool: entryFee,
          current_player: 0,
          dice_value: 1,
        })
        .select()
        .single()

      if (error) throw error

      // Deduct entry fee from user's coins
      await supabase
        .from("users")
        .update({ coins_balance: profile.coins_balance - entryFee })
        .eq("id", profile.id)

      toast.success("Room created successfully!")
      setRoomName("")
      setShowCreateRoom(false)
      fetchRooms()

      // Navigate to the created game
      window.location.href = `/games/ludo/${data.id}`
    } catch (error) {
      console.error("Error creating room:", error)
      toast.error("Failed to create room")
    } finally {
      setIsCreating(false)
    }
  }, [user, profile, roomName, entryFee, supabase, fetchRooms])

  const joinRoom = useCallback(
    async (room: GameRoom) => {
      if (!user || !profile) return

      if (profile.coins_balance < room.entry_fee) {
        toast.error("Insufficient coins to join this room")
        return
      }

      if (room.players.length >= room.max_players) {
        toast.error("Room is full")
        return
      }

      if (room.players.some((p) => p.id === user.id)) {
        // Already in room, just navigate
        window.location.href = `/games/ludo/${room.id}`
        return
      }

      try {
        // Deduct entry fee from user's coins
        await supabase
          .from("users")
          .update({ coins_balance: profile.coins_balance - room.entry_fee })
          .eq("id", profile.id)

        toast.success("Joined room successfully!")

        // Navigate to the game
        window.location.href = `/games/ludo/${room.id}`
      } catch (error) {
        console.error("Error joining room:", error)
        toast.error("Failed to join room")
      }
    },
    [user, profile, supabase],
  )

  useEffect(() => {
    fetchRooms()

    // Subscribe to room updates
    const subscription = supabase
      .channel("ludo_games")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ludo_games",
        },
        () => {
          fetchRooms()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchRooms, supabase])

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.creator_username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-8 w-8" />
            Ludo Game Lobby
          </h1>
          <p className="text-muted-foreground">Join or create a game room and start playing!</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm bg-muted px-3 py-2 rounded-lg">
            <Coins className="h-4 w-4" />
            <span>{profile?.coins_balance || 0} coins</span>
          </div>
          <Button onClick={() => setShowCreateRoom(!showCreateRoom)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Button>
        </div>
      </div>

      {/* Create Room Form */}
      {showCreateRoom && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Game Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Room Name</label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Entry Fee (Coins)</label>
                <Input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  min={1}
                  max={1000}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Prize Pool: {entryFee * 4} coins (winner takes all)</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateRoom(false)}>
                  Cancel
                </Button>
                <Button onClick={createRoom} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms or players..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Game Rooms */}
      <div className="grid gap-4">
        {filteredRooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Game Rooms</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No rooms match your search." : "Be the first to create a game room!"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateRoom(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{room.name}</h3>
                      <Badge
                        variant={
                          room.game_status === "active"
                            ? "default"
                            : room.game_status === "waiting"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {room.game_status}
                      </Badge>
                      {room.creator_id === user?.id && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Created by</p>
                        <p className="text-sm text-muted-foreground">{room.creator_username}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Players</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">
                            {room.players.length}/{room.max_players}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Prize Pool</p>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{room.prize_pool} coins</span>
                        </div>
                      </div>
                    </div>

                    {room.players.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Players in room</p>
                        <div className="flex flex-wrap gap-2">
                          {room.players.map((player, index) => (
                            <div key={player.id} className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={player.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{player.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{player.username}</span>
                              <div className={`w-2 h-2 rounded-full bg-${player.color}-500`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <div className="text-right text-sm text-muted-foreground">Entry: {room.entry_fee} coins</div>
                    {room.players.some((p) => p.id === user?.id) ? (
                      <Link href={`/games/ludo/${room.id}`}>
                        <Button size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Enter Game
                        </Button>
                      </Link>
                    ) : room.game_status === "waiting" && room.players.length < room.max_players ? (
                      <Button
                        size="sm"
                        onClick={() => joinRoom(room)}
                        disabled={!profile || profile.coins_balance < room.entry_fee}
                      >
                        Join Room
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        {room.game_status === "active"
                          ? "In Progress"
                          : room.players.length >= room.max_players
                            ? "Room Full"
                            : "Unavailable"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
