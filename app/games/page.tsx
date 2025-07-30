"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { Gamepad2, Users, Coins, Plus, Play, Clock, Trophy, Loader2 } from "lucide-react"
import Link from "next/link"

interface GameRoom {
  id: string
  name: string
  entry_fee: number
  max_players: number
  current_players: number
  status: "waiting" | "playing" | "finished"
  created_by: string
  created_at: string
  prize_pool: number
}

export default function GamesPage() {
  const { user, profile, isAuthenticated } = useAuth()
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
        toast({
          title: "Error",
          description: "Failed to load game rooms",
          variant: "destructive",
        })
      } else {
        setGameRooms(data || [])
      }
    } catch (error) {
      console.error("Error fetching game rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const createGameRoom = async () => {
    if (!user || !profile) {
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
        description: "Please enter a name for your game room",
        variant: "destructive",
      })
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
          prize_pool: entryFee,
          players: [user.id],
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating game room:", error)
        toast({
          title: "Error",
          description: "Failed to create game room",
          variant: "destructive",
        })
      } else {
        // Deduct coins from user balance
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ coins_balance: profile.coins_balance - entryFee })
          .eq("id", user.id)

        if (updateError) {
          console.error("Error updating coins balance:", updateError)
        }

        toast({
          title: "Success",
          description: "Game room created successfully!",
        })

        setRoomName("")
        setEntryFee(10)
        setIsDialogOpen(false)
        fetchGameRooms()
      }
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

  const joinGameRoom = async (room: GameRoom) => {
    if (!user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a game",
        variant: "destructive",
      })
      return
    }

    if (profile.coins_balance < room.entry_fee) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins to join this room",
        variant: "destructive",
      })
      return
    }

    try {
      // Update game room
      const { error: gameError } = await supabase
        .from("ludo_games")
        .update({
          current_players: room.current_players + 1,
          prize_pool: room.prize_pool + room.entry_fee,
          players: [...(room.players || []), user.id],
        })
        .eq("id", room.id)

      if (gameError) {
        console.error("Error joining game room:", gameError)
        toast({
          title: "Error",
          description: "Failed to join game room",
          variant: "destructive",
        })
        return
      }

      // Deduct coins from user balance
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ coins_balance: profile.coins_balance - room.entry_fee })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating coins balance:", updateError)
      }

      toast({
        title: "Success",
        description: "Joined game room successfully!",
      })

      // Redirect to game
      window.location.href = `/games/ludo/${room.id}`
    } catch (error) {
      console.error("Error joining game room:", error)
      toast({
        title: "Error",
        description: "Failed to join game room",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Games</h1>
              <p className="text-muted-foreground">Play Ludo and win coins!</p>
            </div>
          </div>

          {isAuthenticated && profile && (
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Coins className="h-4 w-4" />
                <span>{profile.coins_balance?.toLocaleString() || 0} Coins</span>
              </Badge>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Game Room</DialogTitle>
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
                    <Button onClick={createGameRoom} disabled={creating} className="w-full">
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Room
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Check */}
      {!isAuthenticated ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sign In to Play</h3>
            <p className="text-muted-foreground mb-4">Create an account to start playing games and winning coins</p>
            <div className="space-x-2">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Game Rooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameRooms.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Rooms</h3>
                    <p className="text-muted-foreground mb-4">Be the first to create a game room!</p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Room
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              gameRooms.map((room) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Waiting
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {room.current_players}/{room.max_players} Players
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4" />
                        <span>{room.entry_fee} Coins</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>Prize: {room.prize_pool} Coins</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => joinGameRoom(room)}
                      disabled={room.current_players >= room.max_players}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {room.current_players >= room.max_players ? "Room Full" : "Join Game"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
